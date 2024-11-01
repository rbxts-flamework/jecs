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

interface Person extends Flag {}
interface Location extends Flag {}
interface Owns extends Flag {}

interface Ketchup extends Flag {}
interface Organic extends Flag {}
interface Expired extends Flag {}

interface Stats {
	spiciness: number;
	tasteRating: number;
}

interface Quantity {
	amount: number;
}

interface Rates {
	comment: string;
	score: number;
}

const frontShelf = spawn<[Location]>();
const topShelf = spawn<[Location]>();
const backOfFridge = spawn<[Location]>();

const marcus = spawn<[Person]>();

const felix = spawn<[Stats, Quantity, Ketchup]>([{ spiciness: 2, tasteRating: 7 }, { amount: 5 }]);
add<Pair<ChildOf>>(felix, frontShelf);

const organicKetchup = spawn<[Stats, Quantity, Ketchup, Organic]>([
	{ spiciness: 3, tasteRating: 8 },
	{ amount: 2 },
]);
add<Pair<ChildOf>>(organicKetchup, topShelf);

const oldKetchup = spawn<[Stats, Quantity, Ketchup, Expired]>([
	{ spiciness: 7, tasteRating: 1 },
	{ amount: 1 },
]);
add<Pair<ChildOf>>(oldKetchup, backOfFridge);

add<Pair<Owns>>(marcus, felix);
set<Pair<Rates>>(marcus, felix, {
	comment: "The superior ketchup for.. hotdog mashed potatoes?!!",
	score: 10,
});

add<Pair<Owns>>(marcus, organicKetchup);
set<Pair<Rates>>(marcus, organicKetchup, {
	comment: "Fancy, but still not Felix",
	score: 7,
});

add<Pair<Owns>>(marcus, oldKetchup);

// Find all of Marcus's ketchup that isn't expired
for (const [entity, stats, quantity] of query<
	[Stats, Quantity, With<[Ketchup, Pair<ChildOf>]>, Without<Expired>]
>()) {
	if (has<Pair<Owns>>(marcus, entity)) {
		const rating = get<Pair<Rates>>(marcus, entity);
		const location = parent(entity);
		print(`Marcus owns this ketchup at entity ${location}:`);
		print(`- Amount left: ${quantity.amount} bottles`);
		print(`- Taste rating: ${stats.tasteRating}`);
		print(`- Marcus's review: ${rating?.comment ?? "Not rated yet"}`);
	}
}

// Find all expired ketchup and their locations
for (const [entity, quantity] of query<[Quantity, With<[Ketchup, Expired, Pair<ChildOf>]>]>()) {
	const location = parent(entity);
	print(`Warning: Found ${quantity.amount} expired ketchup bottles at entity ${location}!`);

	set<Quantity>(entity, { amount: 0 });
}

// Despawn any ketchup that has no bottles left
for (const [entity, quantity] of query<[Quantity, With<Ketchup>]>()) {
	if (quantity.amount === 0) {
		despawn(entity);
	}
}
```
