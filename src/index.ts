/* eslint-disable prettier/prettier */
import { Modding, OnTick, Reflect } from "@flamework/core";
import { RunService, Players } from "@rbxts/services";
import * as ecs from "@rbxts/jecs";

type State = {
    cleanup: Callback;
    state: Record<string, unknown>;
};

interface StackFrame {
    node: Record<string, State>;
}

const stack: StackFrame[] = [];

function addStackFrame(node: Record<string, State>): void {
    const frame: StackFrame = {
        node: node,
    };
    stack.push(frame);
}

function popStackFrame(): void {
    stack.pop();
}

function cleanupAll(): void {
    const current = stack[stack.size() - 1];

    for (const [key] of pairs(current.node)) {
        const state = current.node[key];
        for (const [discriminator] of pairs(state.state)) {
            state.cleanup(state.state[discriminator]);
        }
    }
}


export function start(node: Record<string, State>, fn: () => void): void {
    addStackFrame(node);
    fn();
    cleanupAll();
    popStackFrame();
}

export function useHookState(key: string, discriminator: unknown, cb: (state: unknown) => void) {
    const current = stack[stack.size() - 1];

    let storage = current.node[key];
    if (!storage) {
        storage = { state: {}, cleanup: cb };
        current.node[key] = storage;
    }

    discriminator = discriminator ?? key;
    const stringifiedKey = tostring(discriminator);

    let state = storage.state[stringifiedKey];
    if (state === undefined) {
        state = {};
        storage.state[stringifiedKey] = state;
    }

    return state;
}

type Storage = { expiry: number };
function cleanup(storage: Storage) {
    return os.clock() < storage.expiry;
}

interface ThrottleStorage {
    time?: number;
    expiry?: number;
}

const STABLE_DISCRIMINATOR = {};
/** @metadata macro */
export function useThrottle(seconds: number, discriminator?: unknown, key?: Modding.Caller<"uuid">) {
    assert(key);

    const storage = useHookState(key, discriminator ?? STABLE_DISCRIMINATOR, cleanup as never) as ThrottleStorage;

    if (storage.time === undefined || os.clock() - storage.time >= seconds) {
        storage.time = os.clock();
        storage.expiry = os.clock() + seconds;
        return true;
    }
    return false;
}

export type Relation<T = Tag> = { type: "FLAMECS_RELATION"; value: T };

type Id<T = undefined> = number & {
    __T: T;
};

export type Tag = {
    type: "FLAMECS_TAG";
};

type Signal<T extends Array<unknown>> = {
    fire: (...args: T) => void;
    connect: (fn: (...args: T) => void) => void;
};


const components = new Map<string, Id<unknown>>()

function createSignal<T extends Array<unknown>>(): Signal<T> {
    const listeners = new Array<(...args: T) => void>();
    const fire = (...args: T) => {
        for (const fn of listeners) {
            fn(...args);
        }
    };
    const connect = (fn: (...args: T) => void) => {
        listeners.push(fn);
    };

    return {
        fire,
        connect,
    };
}

const registry = new ecs.World();
export const signals: {
    added: Record<Id<unknown>, Signal<Array<unknown>>>;
    removed: Record<Id<unknown>, Signal<Array<unknown>>>;
    changed: Record<Id<unknown>, Signal<Array<unknown>>>;
} = {
    added: {},
    removed: {},
    changed: {}
};

/** @metadata macro  */
export function component<T>(key?: Modding.Generic<T, "id">): Id<T> {
    assert(key)
    let id = components.get(key)
    if (id === undefined) {
        id = registry.component()
        components.set(key, id)
    }
    const addedSignal = createSignal();
    const removedSignal = createSignal();
    const changedSignal = createSignal();
    signals.added[id] = addedSignal;
    signals.removed[id] = removedSignal;
    signals.changed[id] = changedSignal

    registry.set(id, ecs.OnAdd, (entity) => {
        addedSignal.fire(entity);
    });
    registry.set(id, ecs.OnRemove, (entity) => {
        removedSignal.fire(entity);
    });
    registry.set(id, ecs.OnSet, (entity, data) => {
        changedSignal.fire(entity, data)
    })
    return id as never
}

interface Changes<T> {
    added: (entity: number) => void,
    removed: (entity: number) => void,
    changed: (entity: number, current: T, previous: T) => void
}

export function createTracker<T>(key?: Modding.Generic<T, "id">) {
    assert(key !== undefined)
    const id = component<T>()
    
    let previous = new Array<T>()

    const added = new Array<number>()
    const removed = new Array<number>();
    let changedEntities = new Array<number>();
    let changedData = new Array<T>();

    (signals.added[id] as Signal<[number]>)
        .connect((entity: number) => {
            added.push(entity)
        });

    (signals.removed[id] as Signal<[number]>)
        .connect((entity: number) => {
            removed.push(entity)
        });

    (signals.changed[id] as Signal<[number, T]>)
        .connect((entity: number, data: T) => {
            const len = changedData.size()
            changedEntities[len] = entity
            changedData[len] = data
        });

    const changes: Changes<T> = {
        added: () => {
            let i = 0
            return () => {
                const e = added[i] 
                i++
                return e
            }
        },
        changed: () => {
            let i = 0
            return () => {
                const e = changedEntities[i] 
                if (e === undefined) {
                    return
                }
                const data = changedData[i]
                const old = previous[i]
                i++
                return $tuple(e, data, old)
            }
        },
        removed: () => {
            let i = 0
            return () => {
                const e = removed[i] 
                i++
                return e
            }
        }
    }

    return (fn: Callback) => {
        fn(changes)
        previous = changedData  
        changedEntities = new Array<number>()
        changedData = new Array<T>()
    }
}

export function added<T>(id: Id<T>): Signal<[number, T]> {
    return signals.added[id] as never;
}

export function removed<T>(id: Id<T>): Signal<[number]> {
    return signals.removed[id] as never;
}

/** @metadata macro */
export function spawn<T extends Array<unknown>>(
    bundle: T,
    keys?: Modding.Many<{[K in keyof T]: Modding.Generic<T[K], "id">}>
): number {
    assert(keys !== undefined)
    const e = registry.entity()
    const n = bundle.size()
    for (const i of $range(0, n - 1)) {
        const key = keys[i]
        const data = bundle[i]
        const id = component(key)
        registry.set(e, id, data)
    }
    
    return e;
}

/** @metadata macro */
export function set<T>(
    entity: number, 
    value: T,
    key?: Modding.Generic<T, "id">
) {
    const id = component(key)
    registry.set(entity as never, id, value);
}

/** @metadata macro */
export function add<T>(entity: number, key?: Modding.Generic<T, "id">): void {
    const id = component(key)
    registry.add(entity as never, id)
}

/** @metadata macro */
export function remove<T>(entity: number, key?: Modding.Generic<T, "id">): void {
    const id = component(key)
    registry.remove(entity as never, id)
}

/** @metadata macro */
export function get<T>(entity: number, key?: Modding.Generic<T, "id">): T | undefined {
    const id = component(key)
    return registry.get(entity as never, id)
}

/** @metadata macro */
export function has<T>(entity: number, key?: Modding.Generic<T, "id">): boolean {
    const id = component(key)
    return registry.has(entity as never, id)
}

/** @metadata macro */
export function query<With extends Array<unknown>, Without extends Array<unknown> = []>(
    terms?: Modding.Many<{[
        Term in keyof With]: Modding.Generic<With[Term], "id">
    }>,
    filter?: Modding.Many<{[
        Term in keyof Without]: Modding.Generic<Without[Term], "id">
    }>
): Query<With> {
    assert(terms !== undefined)
    const ids = new Array<number>()
    for (const key of terms) {
        const id = component(key)
        ids.push(id)
    }
    const q = registry.query(...ids)
    if (filter !== undefined) {
        const ids = new Array<number>()
        for (const key of filter) {
            const id = component(key)
            ids.push(id)
        }
        return q.without(...ids) as never
    }

    return q as never
}

export function despawn(entity: number) {
    registry.delete(entity as never);
}

type DynamicBundle = Array<Id<unknown>>;

type QueryIter<T extends unknown[]> = IterableFunction<LuaTuple<[number, ...T]>>;

type Query<T extends unknown[]> = QueryIter<T> & {
    without: (this: Query<T>, ...exclude: DynamicBundle) => Query<T>;
};

let isPreloading = false;
// RuntimeLib, which is required to import packages
const tsImpl = (_G as Map<unknown, unknown>).get(script) as {
    import: (...modules: LuaSourceContainer[]) => unknown;
};
/** @hidden */
export function _addPaths(paths: string[][]) {
    const preloadPaths = new Array<Instance>();
    for (const arg of paths) {
        const service = arg.shift();
        let currentPath: Instance = game.GetService(service as keyof Services);
        if (service === "StarterPlayer") {
            if (arg[0] !== "StarterPlayerScripts") throw "StarterPlayer only supports StarterPlayerScripts";
            if (!RunService.IsClient()) throw "The server cannot load StarterPlayer content";
            currentPath = Players.LocalPlayer.WaitForChild("PlayerScripts");
            arg.shift();
        }
        for (let i = 0; i < arg.size(); i++) {
            currentPath = currentPath.WaitForChild(arg[i]);
        }
        preloadPaths.push(currentPath);
    }

    const preload = (moduleScript: ModuleScript) => {
        isPreloading = true;
        const start = os.clock();
        const [success, value] = pcall(() => tsImpl.import(script, moduleScript));
        const endTime = math.floor((os.clock() - start) * 1000);
        isPreloading = false;
        if (!success) {
            throw `${moduleScript.GetFullName()} failed to preload (${endTime}ms): ${value}`;
        }
    };

    for (const path of preloadPaths) {
        if (path.IsA("ModuleScript")) {
            preload(path);
        }
        for (const instance of path.GetDescendants()) {
            if (instance.IsA("ModuleScript")) {
                preload(instance);
            }
        }
    }
}
/**
 * Preload the specified paths by requiring all ModuleScript descendants.
 *
 * @metadata macro intrinsic-arg-shift {@link _addPaths intrinsic-flamework-rewrite}
 */
export declare function addPaths<T extends string>(path: T, meta?: Modding.Intrinsic<"path", [T]>): void;

