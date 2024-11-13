# Flamecs

Flamework + ECS = Flamecs 🔥

-   Blazingly Stupid
-   Looking for VC funding
-   Use types as components
-   Zero-cost topologically aware functions
-   Built-in Scheduler (soon)
-   Component Metadata (soon)

## Installation

This package is an extension of Flamework and it must be installed and configured. If Flamework is already installed, you can install `@rbxts/flamecs` and skip these steps.

### Install Flamework packages

You can install all the necessary packages using the following command.

```bash
npm install -D rbxts-transformer-flamework
npm install @flamework/core

# Install flamecs, if it isn't already
npm install @rbxts/flamecs
```

### Configure the transformer

The Flamework transformer must be configured in your `tsconfig.json`. The fields should be placed inside of the `compilerOptions` object.

```jsonc
{
	"compilerOptions": {
		// Add `node_modules/@flamework` into your `typeRoots` field.
		"typeRoots": ["node_modules/@rbxts", "node_modules/@flamework"],

		// Copy the following fields
		"experimentalDecorators": true,
		"plugins": [
			{
				"transform": "rbxts-transformer-flamework",
			},
		],
	},
}
```

### Configure your Rojo project

Flamework uses a custom npm org and must be configured in your `default.project.json`.

You should find the entry for `node_modules` and modify it to include `@flamework`. It should look something like this:

```json
"node_modules": {
	"@rbxts": {
		"$path": "node_modules/@rbxts"
	},
	"@flamework": {
		"$path": "node_modules/@flamework"
	}
}
```

### Recompile

You may need to delete the `out` folder and recompile for Flamework's transformer to begin working. Afterwards, you are ready to use flamecs.

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
