import { Flamework, type Modding } from "@flamework/core";

interface State {
    cleanup: Callback;
    state: Record<string, unknown>;
}

interface StackFrame {
    node: Record<string, State>;
}

const stack: Array<StackFrame> = [];

function addStackFrame(node: Record<string, State>): void {
    const frame: StackFrame = {
        node,
    };
    stack.push(frame);
}

function popStackFrame(): void {
    stack.pop();
}

function cleanupAll(): void {
    const current = stack[stack.size() - 1]!;

    for (const [key] of pairs(current.node)) {
        const state = current.node[key]!;
        for (const [discriminator] of pairs(state.state)) {
            state.cleanup(state.state[discriminator]);
        }
    }
}

export function start(node: Record<string, State>, func: () => void): void {
    addStackFrame(node);
    func();
    cleanupAll();
    popStackFrame();
}

// eslint-disable-next-line ts/explicit-function-return-type -- Returns unknown.
export function useHookState(
    key: string,
    discriminator: unknown,
    callback: (state: unknown) => void,
) {
    const current = stack[stack.size() - 1]!;
    let storage = current.node[key];
    if (!storage) {
        storage = { cleanup: callback, state: {} };
        current.node[key] = storage;
    }

    discriminator ??= key;
    const stringifiedKey = tostring(discriminator);

    let state = storage.state[stringifiedKey];
    if (state === undefined) {
        state = {};
        storage.state[stringifiedKey] = state;
    }

    return state;
}

interface Storage {
    expiry: number;
}

function cleanup(storage: Storage): boolean {
    return os.clock() < storage.expiry;
}

interface ThrottleStorage {
    expiry?: number;
    time?: number;
}

const STABLE_DISCRIMINATOR = {};

/**
 * Utility for easy time-based throttling.
 *
 * Accepts a duration, and returns `true` if it has been that long since the
 * last time this function returned `true`. Always returns `true` the first
 * time.
 *
 * @param seconds - The number of seconds to throttle for.
 * @param discriminator -- A unique value to additionally key by.
 * @param key - An automatically generated key to store the throttle state.
 * @returns - Returns true every x seconds, otherwise false.
 * @metadata macro
 */
export function useThrottle(
    seconds: number,
    discriminator?: unknown,
    key?: Modding.Caller<"uuid">,
): boolean {
    assert(key);

    const storage = useHookState(
        key,
        discriminator ?? STABLE_DISCRIMINATOR,
        cleanup as never,
    ) as ThrottleStorage;

    if (storage.time === undefined || os.clock() - storage.time >= seconds) {
        storage.time = os.clock();
        storage.expiry = os.clock() + seconds;
        return true;
    }

    return false;
}
