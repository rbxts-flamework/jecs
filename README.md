# Flamecs

Flamework + ECS = Flamecs 🔥

-   Blazingly Stupid
-   Looking for VC funding
-   Use types as components
-   Zero-cost topologically aware functions
-   Built-in Scheduler (soon)
-   Component Metadata (soon)

## Components

```typescript
interface Position {
	x: number;
	y: number;
}

// Tag (no data)
interface Player extends Tag {}

// Components can be wrapped to use non-table data
interface Name extends Wrap<string> {}
interface Health extends Wrap<number> {}
```

## Entities

### Spawning Entities

```typescript
const entity = spawn();

// When spawning with tags the bundle list can be omitted
const marcus = spawn<[Player]>();

const ketchup = spawn<[Position, Player]>([{ x: 0, y: 0 }]);

// Get the runtime entity id from a component
const positionComponent = component<Position>();
```

### Modifying Entities

```typescript
add<Player>(entity);

set<Position>(entity, { x: 10, y: 20 });
set<Name>(entity, "Alice");

// Insert can be used to add/set multiple components
insert<[Name, Health, Player]>(entity, ["Bob", 100]);

remove<Player>(entity);

if (has<Player>(entity)) {
	// ...
}

const pos = get<Position>(entity);
const name = get<Name>(entity);

despawn(entity);
```

## Queries

```typescript
for (const [entity, pos, name] of query<[Position, Name]>()) {
	print(`${name} at ${pos.x}, ${pos.y}`);
}

for (const [entity, pos] of query<[Position, Without<Player>]>()) {
	// ...
}

for (const [entity, pos] of query<[Position, With<[Player, Health]>]>()) {
	// ...
}
```

## Relationships

### Defining Relationships

```typescript
interface Likes extends Tag {}
interface Owns extends Wrap<number> {}

// Alice likes Bob
add<Pair<Likes>>(alice, bob);

// Alice owns 5 items
set<Pair<Owns, Item>>(alice, 5);
```

### Querying Relationships

```typescript
// Query all entities that like something Pair<Likes, Wildcard>
for (const [entity] of query<[Pair<Likes>]>()) {
	const target = target<Likes>(entity);
	print(`${entity} likes ${target}`);
}

// Query specific relationships where the object is a runtime id
for (const [entity] of query().pair<Likes>(bob)) {
	// ...
}
```

## Signals

```typescript
added<Position>().connect((entity) => {
	print(`Position added to ${entity}`);
});

removed<Position>().connect((entity) => {
	print(`Position removed from ${entity}`);
});

changed<Position>().connect((entity, newValue) => {
	print(`Position of ${entity} changed to ${newValue}`);
});
```

## Hooks and Systems

```typescript
// Hooks must be used within a `start()` function.
start({}, () => {
	if (useThrottle(0.5)) {
		// ...
	}

	for (const [player] of useEvent(Players.PlayerAdded)) {
		const entity = spawn<[Name, Player]>([player.Name]);
		// ...
	}
});
```
