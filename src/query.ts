import { Flamework, type Modding } from "@flamework/core";
import * as ecs from "@rbxts/jecs"
import { registry, component, type Id } from "./registry"

// Full credits to @fireboltofdeath for all of these types. */
export interface Without<T> {
    _flamecs_without: T;
}
export interface With<T> {
    _flamework_with: T;
}

type Skip<T extends Array<unknown>> = T extends [unknown, ...infer R] ? R : [];

interface Bounds {
    query: Array<unknown>;
    with: Array<unknown>;
    without: Array<unknown>;
}
type BoundsTuple<T> = T extends { length: number } & ReadonlyArray<unknown> ? T : [];
type PushBound<B extends Bounds, K extends keyof B, V> = Omit<B, K> &
    Record<
        K,
        V extends ReadonlyArray<unknown> ? [...BoundsTuple<B[K]>, ...V] : [...BoundsTuple<B[K]>, V]
    >;

type Calculate<T extends Array<unknown>, B extends Bounds = Bounds> = T extends []
    ? { [k in keyof B]: BoundsTuple<B[k]> }
    : T[0] extends Without<infer V>
    ? Calculate<Skip<T>, PushBound<B, "without", V>>
    : T[0] extends With<infer V>
    ? Calculate<Skip<T>, PushBound<B, "with", V>>
    : Calculate<Skip<T>, PushBound<B, "query", T[0]>>;
type ToIds<T> = T extends []
    ? undefined
    : Modding.Many<{
        [k in keyof T]: Modding.Generic<T[k], "id">;
    }>;
/**
 * A World contains entities which have components. The World is queryable and
 * can be used to get entities with a specific set of components.
 *
 * @template T - The components that the entity must have.
 * @template With - The components that the entity must have.
 * @template Without - The components that the entity must not have.
 * @param terms - Flamework autogenerated key.
 * @param filterWithout - Flamework autogenerated key.
 * @param filterWith - Flamework autogenerated key.
 * @returns The query object.
 * @metadata macro
 */
interface Query {
    /** @metadata macro */
    <T extends Array<unknown>>(
        terms?: ToIds<Calculate<T>["query"]>,
        filterWithout?: ToIds<Calculate<T>["without"]>,
        filterWith?: ToIds<Calculate<T>["with"]>,
    ): QueryHandle<Reconstruct<Calculate<T>["query"]>>;

    rt: <U extends Array<ecs.Entity>>(...args: U) => ecs.Query<ecs.InferComponents<U>>;
}

/** @metadata macro */
export function query<T extends Array<unknown>>(
    terms?: ToIds<Calculate<T>["query"]>,
    filterWithout?: ToIds<Calculate<T>["without"]>,
    filterWith?: ToIds<Calculate<T>["with"]>,
): QueryHandle<Reconstruct<Calculate<T>["query"]>> {
    assert(terms !== undefined);
    const ids = new Array<number>();
    for (const key of terms) {
        const id = component(key);
        ids.push(id);
    }

    let result = registry.query(...ids);
    if (filterWithout !== undefined) {
        const filterWithoutIds = new Array<number>();
        for (const key of filterWithout) {
            const id = component(key);
            filterWithoutIds.push(id);
        }

        result = result.without(...filterWithoutIds);
    }

    if (filterWith !== undefined) {
        const filterWithIds = new Array<number>();
        for (const key of filterWith) {
            const id = component(key);
            filterWithIds.push(id);
        }

        result = result.with(...filterWithIds);
    }

    return result as never
}

export function queryRuntimeVersionOnlyIfYouRuntimeValueIds<T extends Array<number>>(
    ...ids: T
) {
    return registry.query(...ids)
}


type DynamicBundle = Array<Id<unknown>>;

type QueryIter<T extends Array<unknown>> = IterableFunction<LuaTuple<[number, ...T]>>;

type QueryHandle<T extends Array<unknown>> = {
    without: (this: QueryHandle<T>, ...exclude: DynamicBundle) => QueryHandle<T>;
} & QueryIter<T>;