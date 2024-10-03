# Flamecs
Flamework + ECS = Flamecs 🔥

- Blazingly Stupid
- Looking for VC funding
- Use types as components
- Zero-cost topologically aware functions
- Built-in Scheduler (soon)
- Component Metadata (soon)

```ts
import { start, useThrottle, component, spawn, add, has, query } from "@rbxts/flamecs";

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

// You can also use pairs but you need to opt into the runtime query interface
// Use component<T> to generate runtime IDs for your interfaces

for (const [entity, p0] of query.rt(component<Vector3>()).with(pair(ChildOf, parent))) {
	print(e, p0);
}
```
