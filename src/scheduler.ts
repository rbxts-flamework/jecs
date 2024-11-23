import { query } from "./query";
import { Entity, Pair, registry, spawn, Tag } from "./registry";
import { Flamework, Modding } from "@flamework/core";

export interface OnStart {
	OnStart(): void;
}

export interface PreRender {
	PreRender(dt: number): void;
}

export interface PreAnimation {
	PreAnimation(dt: number): void;
}

export interface PreUpdate {
	PreUpdate(dt: number): void;
}

export interface OnUpdate {
	OnUpdate(dt: number): void;
}

export interface PostUpdate {
	PostUpdate(dt: number): void;
}

const onStarts = new Array<OnStart>();
Modding.onListenerAdded<OnStart>((object) => onStarts.push(object));

const RunService = game.GetService("RunService");

export function start() {
	for (const object of onStarts) {
		object.OnStart();
	}

	const preRender = new Array<PreRender>();
	Modding.onListenerAdded<PreRender>((object) => preRender.push(object));
	RunService.PreRender.Connect((dt) => {
		for (const obj of preRender) {
			obj.PreRender(dt);
		}
	});

	const preAnimation = new Array<PreAnimation>();
	const preUpdates = new Array<PreUpdate>();

	const onUpdates = new Array<OnUpdate>();
	const postUpdates = new Array<PostUpdate>();

	Modding.onListenerAdded<PreAnimation>((object) => preAnimation.push(object));
	RunService.PreRender.Connect((dt) => {
		for (const obj of preAnimation) {
			obj.PreAnimation(dt);
		}
	});

	Modding.onListenerAdded<PreUpdate>((object) => preUpdates.push(object));
	RunService.PreSimulation.Connect((dt) => {
		for (const obj of preUpdates) {
			obj.PreUpdate(dt);
		}
	});

	Modding.onListenerAdded<OnUpdate>((object) => onUpdates.push(object));
	Modding.onListenerAdded<PostUpdate>((object) => postUpdates.push(object));
	RunService.Heartbeat.Connect((dt) => {
		for (const obj of onUpdates) {
			obj.OnUpdate(dt);
		}
		for (const obj of postUpdates) {
			obj.PostUpdate(dt);
		}
	});
}
