# Flamecs 
Flamework + ECS = Flamecs 🔥

- Blazingly Stupid
- Looking for VC funding
- Use types as components
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

// The second generic argument is the terms you would like to exclude in `Without`
for (const [e, vec] of query<[Vector3], [CFrame]>()) {
	print(e, vec);
}
```
