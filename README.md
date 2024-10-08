# Flamecs

Flamework + ECS = Flamecs 🔥

-   Blazingly Stupid
-   Looking for VC funding
-   Use types as components
-   Zero-cost topologically aware functions
-   Built-in Scheduler (soon)
-   Component Metadata (soon)

```ts
const e = spawn<[Vector3]>([new Vector3()]);
print(has<Vector3>(e));

start({}, () => {
	if (useThrottle(5)) {
		for (const [entity, vec3, cf] of query<[Vector3, CFrame]>()) {
			print(entity, vec3, cf);
		}
	}
});

for (const [e, vec] of query<[Vector3, Without<[CFrame]>]>()) {
	print(e, vec);
}

// Example of using pairs
interface Likes {}
interface Eats {}
interface Apple {}

const alice = spawn();
const bob = spawn();
const charlie = spawn();

const Likes = component<Likes>();
const Eats = component<Eats>();

registry.set(alice, registry.pair(Likes, bob));
registry.set(alice, registry.pair(Likes, charlie));

set<Pair<Eats, Apple>>(bob, 3);

for (const [e] of query<[]>().pair<Likes>(bob)) {
	const liked = target<Likes>(e);
	print(`${e} likes ${liked}`);
}

for (const [e, amount] of query<[Pair<Eats, Apple>]>()) {
	const eatsTarget = target<Eats>(e);
	print(`${e} eats ${amount} ${eatsTarget}`);
}

// Using Pair<P> to match any target (wildcard)
// equivelant to Pair<Likes, Wildcard>
for (const [e] of query<[Pair<Likes>]>()) {
	const likedTarget = target<Likes>(e);
	print(`${e} likes ${likedTarget}`);
}
```
