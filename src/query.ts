import type { Modding } from "@flamework/core";

import * as ecs from "./jecs";
import type { Entity, FilterPairs, Id, SolveKey } from "./registry";
import { component, getId, registry } from "./registry";

// Almost full credits to @fireboltofdeath for all of these types.
export interface Without<T> {
	_flamecs_without: T;
}
export interface With<T> {
	_flamecs_with: T;
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
			[k in keyof T]: SolveKey<T[k]>;
		}>;

type ExtractQueryTypes<T extends Array<unknown>> = Reconstruct<FilterPairs<Calculate<T>["query"]>>;

type QueryHandle<T extends Array<unknown>> = {
	__iter(): IterableFunction<LuaTuple<[Entity, ...T]>>;
	filterWith?: Array<Id>;
	filterWithout?: Array<Id>;
	/**
	 * Adds a pair with a runtime entity id to the query. The value of the
	 * relationship is appended to the end of the iterator tuple.
	 *
	 * @template P - The type of the predicate component.
	 * @param object - The object component ID to filter.
	 * @param predicate - The optional predicate component key to filter.
	 * @returns A new QueryHandle with the pair filter added.
	 * @metadata macro
	 */
	pair<P>(object: Entity, predicate?: Modding.Generic<P, "id">): QueryHandle<[...T, P]>;
	terms?: Array<Id>;
} & IterableFunction<LuaTuple<[Entity, ...T]>>;

function queryPair<T extends Array<unknown>, P>(
	this: QueryHandle<T>,
	object: Entity,
	predicate?: Modding.Generic<P, "id">,
): QueryHandle<[...T, P]> {
	assert(predicate);
	const id = ecs.pair(component(predicate), object);
	this.terms = this.terms ? [...this.terms, id] : [id];
	return this as unknown as QueryHandle<[...T, P]>;
}

function queryIter<T extends Array<unknown>>(
	this: QueryHandle<T>,
): IterableFunction<LuaTuple<[Entity, ...T]>> {
	if (this.terms) {
		let ecsQuery = registry.query(...this.terms);

		if (this.filterWithout) {
			ecsQuery = ecsQuery.without(...this.filterWithout);
		}

		if (this.filterWith) {
			ecsQuery = ecsQuery.with(...this.filterWith);
		}

		return ecsQuery.iter() as IterableFunction<LuaTuple<[Entity, ...T]>>;
	}

	return (() => {
		// Do nothing.
	}) as IterableFunction<LuaTuple<[Entity, ...T]>>;
}

/**
 * A world contains entities associated with some components. This function
 * creates a query handle for retrieving entities that match the specified
 * components and filters.
 *
 * @template T - The types of the components involved in the query.
 * @param terms - The component IDs to be queried.
 * @param filterWithout - The component IDs that entities must not have.
 * @param filterWith - The component IDs that entities must have.
 * @returns A QueryHandle for chaining additional filters or executing the
 *   query.
 * @metadata macro
 */
export function query<T extends Array<unknown> = []>(
	terms?: ToIds<Calculate<T>["query"]>,
	filterWithout?: ToIds<Calculate<T>["without"]>,
	filterWith?: ToIds<Calculate<T>["with"]>,
): QueryHandle<ExtractQueryTypes<T>> {
	const processedTerms = terms?.map(getId);
	const processedFilterWithout = filterWithout?.map(getId);
	const processedFilterWith = filterWith?.map(getId);

	const queryHandle = {
		__iter: queryIter,
		filterWith: processedFilterWith,
		filterWithout: processedFilterWithout,
		pair: queryPair,
		terms: processedTerms,
	} as QueryHandle<ExtractQueryTypes<T>>;
	setmetatable(queryHandle, queryHandle as LuaMetatable<QueryHandle<ExtractQueryTypes<T>>>);
	return queryHandle;
}

/**
 * Creates a query for retrieving entities that match the specified runtime
 * component IDs. It's unlikely you'll need this and using `query` is
 * recommended.
 *
 * @template T - The types of the component IDs involved in the query.
 * @param ids - The runtime component IDs to be queried.
 * @returns A Query object that can be used to iterate over entities with the
 *   specified components.
 */
export function queryRuntimeIds<T extends Array<Id>>(...ids: T): ecs.Query<ecs.InferComponents<T>> {
	return registry.query(...ids);
}
