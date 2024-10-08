export type Entity<T = unknown> = number & { __ecs_value: T };
export type Pair<P = undefined, O = undefined, V = P> = number & {
  __ecs_pair_pred: P;
  __ecs_pair_obj: O;
  __ecs_pair_value: V;
};
export type Id<T = unknown> = Entity<T> | Pair<unknown, unknown, T>;
export type Tag = Entity<undefined>;

type Iter<T extends unknown[]> = IterableFunction<LuaTuple<[Entity, ...T]>>;

export interface Query<T extends unknown[]> extends Iter<T> {
  iter(): Iter<T>;
  with(...components: Id[]): Query<T>;
  without(...components: Id[]): Query<T>;
  expand<U extends Id[]>(...components: U): Query<[...T, ...U]>;
}

type FlattenTuple<T extends any[]> = T extends [infer U] ? U : LuaTuple<T>;
type Nullable<T extends unknown[]> = { [K in keyof T]: T[K] | undefined };
type InferComponents<A extends Id[]> = {
  [K in keyof A]: A[K] extends Id<infer T> ? T : never;
};
type TupleForWorldGet = [Id] | [Id, Id] | [Id, Id, Id] | [Id, Id, Id, Id];

export class World {
  constructor();
  entity(): Tag;
  component<T = unknown>(): Entity<T>;
  target(entity: Entity, relation: Entity, index?: number): Entity | undefined;
  clear(entity: Entity): void;
  delete(entity: Entity): void;
  add<T>(entity: Entity, component: Id<T>): void;
  set<T>(entity: Entity, component: Id<T>, data: T): void;
  remove<T>(entity: Entity, component: Id<T>): void;
  get<T extends TupleForWorldGet>(
    entity: Entity,
    ...components: T
  ): FlattenTuple<Nullable<InferComponents<T>>>;
  has(entity: Entity, ...components: Id[]): boolean;
  contains(entity: Entity): boolean;
  query<T extends Id[]>(...components: T): Query<InferComponents<T>>;
  parent(entity: Entity): Entity | undefined;
}

export function pair<P, O, V = P>(
  pred: Entity<P>,
  obj: Entity<O>
): Pair<P, O, V>;

export function IS_PAIR(value: Id): value is Pair;
export function pair_first<P, O, V = P>(pair: Pair<P, O, V>): Entity<P>;
export function pair_second<P, O, V = P>(pair: Pair<P, O, V>): Entity<O>;

export const OnAdd: Entity<(e: Entity) => void>;
export const OnRemove: Entity<(e: Entity) => void>;
export const OnSet: Entity<(e: Entity, value: unknown) => void>;
export const ChildOf: Entity;
export const Wildcard: Entity;
export const w: Entity;
export const OnDelete: Entity;
export const OnDeleteTarget: Entity;
export const Delete: Entity;
export const Remove: Entity;
export const Name: Entity<string>;
export const Rest: Entity;
