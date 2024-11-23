import type { OnInit } from "@flamework/core";
import { Controller, Modding, Service } from "@flamework/core";

import { start } from "./topo";

export interface PreRender {
	preRender(dt: number): void;
}

export interface PreAnimation {
	preAnimation(dt: number): void;
}

export interface PreUpdate {
	preUpdate(dt: number): void;
}

export interface OnUpdate {
	onUpdate(dt: number): void;
}

export interface PostUpdate {
	postUpdate(dt: number): void;
}

/** @metadata macro */
function getLifecycleSet<T>(id?: Modding.Generic<T, "id">): Set<T> {
	const set = new Set<T>();
	Modding.onListenerAdded<T>(value => set.add(value), id);
	Modding.onListenerRemoved<T>(value => set.delete(value), id);
	return set;
}

const RunService = game.GetService("RunService");

@Controller()
@Service()
export class Scheduler implements OnInit {
	public onInit(): void {
		const preRender = getLifecycleSet<PreRender>();
		RunService.PreRender.Connect(dt => {
			for (const object of preRender) {
				start({}, () => {
					object.preRender(dt);
				});
			}
		});

		const preAnimation = getLifecycleSet<PreAnimation>();
		RunService.PreAnimation.Connect(dt => {
			for (const object of preAnimation) {
				start({}, () => {
					object.preAnimation(dt);
				});
			}
		});

		const preUpdates = getLifecycleSet<PreUpdate>();
		RunService.PreSimulation.Connect(dt => {
			for (const object of preUpdates) {
				start({}, () => {
					object.preUpdate(dt);
				});
			}
		});

		const onUpdates = getLifecycleSet<OnUpdate>();
		const postUpdates = getLifecycleSet<PostUpdate>();
		RunService.Heartbeat.Connect(dt => {
			for (const object of onUpdates) {
				start({}, () => {
					object.onUpdate(dt);
				});
			}

			for (const object of postUpdates) {
				start({}, () => {
					object.postUpdate(dt);
				});
			}
		});
	}
}
