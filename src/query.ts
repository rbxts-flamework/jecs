import { registry, SolveKey, Id, FilterPairs, getId, Entity } from "./registry";
import * as ecs from "./jecs";
import { Modding } from "@flamework/core";

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
	/**
	 * Adds a pair with a runtime entity id to the query.
	 * The value of the relationship is appended to the end of the iterator tuple.
	 *
	 * @template P - The type of the predicate component.
	 * @param object - The object component ID to filter.
	 * @param predicate - The optional predicate component key to filter.
	 * @returns A new QueryHandle with the pair filter added.
	 * @metadata macro
	 */
	pair<P>(object: Entity, predicate?: SolveKey<P>): QueryHandle<[...T, P]>;
} & IterableFunction<LuaTuple<[Entity, ...T]>>;

/**
 * A world contains entities associated with some components.
 * This function creates a query handle for retrieving entities that match the specified components and filters.
 *
 * @template T - The types of the components involved in the query.
 * @param terms - The component IDs to be queried.
 * @param filterWithout - The component IDs that entities must not have.
 * @param filterWith - The component IDs that entities must have.
 * @returns A QueryHandle for chaining additional filters or executing the query.
 * @metadata macro
 */
export function query<T extends Array<unknown>>(
	terms?: ToIds<Calculate<T>["query"]>,
	filterWithout?: ToIds<Calculate<T>["without"]>,
	filterWith?: ToIds<Calculate<T>["with"]>,
): QueryHandle<ExtractQueryTypes<T>> {
	assert(terms);
	const ids = new Array<Id>();
	for (const key of terms) {
		const id = getId(key);
		ids.push(id);
	}

	let ecsQuery = registry.query(...ids);
	if (filterWithout !== undefined) {
		const filterWithoutIds = new Array<Id>();
		for (const key of filterWithout) {
			const id = getId(key);
			filterWithoutIds.push(id);
		}

		ecsQuery = ecsQuery.without(...filterWithoutIds);
	}

	if (filterWith !== undefined) {
		const filterWithIds = new Array<Id>();
		for (const key of filterWith) {
			const id = getId(key);
			filterWithIds.push(id);
		}

		ecsQuery = ecsQuery.with(...filterWithIds);
	}

	const queryHandle = ecsQuery as unknown as QueryHandle<ExtractQueryTypes<T>>;

	queryHandle.pair = function <P>(
		this: QueryHandle<ExtractQueryTypes<T>>,
		object: Entity,
		predicate?: SolveKey<P>,
	) {
		assert(predicate);
		const id = getId(predicate);
		return ecsQuery.expand(object, id) as unknown as QueryHandle<[...ExtractQueryTypes<T>, P]>;
	};

	return queryHandle;
}

/**
 * Creates a query for retrieving entities that match the specified runtime component IDs.
 * It's unlikely you'll need this and using `query` is recommended.
 *
 * @template T - The types of the component IDs involved in the query.
 * @param ids - The runtime component IDs to be queried.
 * @returns A Query object that can be used to iterate over entities with the specified components.
 */
export function queryRuntimeIds<T extends Id[]>(...ids: T): ecs.Query<ecs.InferComponents<T>> {
	return registry.query(...ids);
}
