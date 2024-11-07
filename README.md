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
		]
	}
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

## Demo

```ts
const positionEntity = spawn<[Vector3]>([new Vector3(10, 20, 30)]);
print(has<Vector3>(positionEntity));

start({}, () => {
	if (useThrottle(5)) {
		for (const [entity, position, orientation] of query<[Vector3, CFrame]>()) {
			print(`Entity: ${entity}, Position: ${position}, Orientation: ${orientation}`);
		}
	}
});

for (const [entity, position] of query<[Vector3, Without<[CFrame]>]>()) {
	print(`Entity: ${entity}, Position: ${position}`);
}

// Example of using pair relationships between entities
interface Likes {}
interface Eats {
	count: number;
}

interface Fruit {}

const alice = spawn();
const bob = spawn();
const charlie = spawn();

const banana = spawn();
add<Fruit>(banana);

add<Pair<Likes>>(alice, bob);
add<Pair<Likes>>(alice, charlie);

add<Pair<Likes, Fruit>>(bob);

set<Pair<Eats>>(bob, banana, { count: 5 });
set<Pair<Eats, Fruit>>(alice, { count: 12 });

for (const [entity] of query().pair<Likes>(alice)) {
	const likedEntity = target<Likes>(entity);
	print(`Entity ${entity} likes ${likedEntity}`);
}

for (const [entity, eatsData] of query<[Pair<Eats, Fruit>]>()) {
	const eatsTarget = target<Eats>(entity);
	print(`Entity ${entity} eats ${eatsData.count} fruit (${eatsTarget})`);
}

// Using Pair<P> to match any target (wildcard), equivalent to Pair<Likes, Wildcard>
for (const [entity] of query<[Pair<Likes>]>()) {
	const likedTarget = target<Likes>(entity);
	print(`Entity ${entity} likes ${likedTarget}`);
}
```
