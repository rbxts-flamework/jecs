# Flamecs

Flamework + ECS = Flamecs 🔥

-   Blazingly Stupid
-   Looking for VC funding
-   Use types as components
-   Zero-cost topologically aware functions
-   Built-in Scheduler (soon)
-   Component Metadata (soon)

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
