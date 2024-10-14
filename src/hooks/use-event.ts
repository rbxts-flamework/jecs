import type { Modding } from "@flamework/core";

import { useHookState } from "../topo";

type DisconnectFunction = () => void;

interface Connection {
	Disconnect?(this: Connection): void;
	disconnect?(this: Connection): void;
}

type Callback<T extends Array<unknown>> = (...args: T) => void;

type Signal<T extends Array<unknown>> =
	| ((callback: Callback<T>) => Connection)
	| {
			connect?(this: Signal<T>, callback: Callback<T>): Connection;
			Connect?(this: Signal<T>, callback: Callback<T>): Connection;
			on?(this: Signal<T>, callback: Callback<T>): Connection;
	  };

interface EventStorage<T extends Array<unknown>> {
	connection: Connection | DisconnectFunction | undefined;
	events: Array<T>;
}

function cleanup<T extends Array<unknown>>(storage: EventStorage<T>): boolean {
	if (storage.connection) {
		if (typeIs(storage.connection, "function")) {
			storage.connection();
		} else if (storage.connection.disconnect !== undefined) {
			storage.connection.disconnect();
		} else if (storage.connection.Disconnect !== undefined) {
			storage.connection.Disconnect();
		} else {
			warn("No disconnect method found on the connection object.");
		}
	}

	return true;
}

/**
 * A hook for easy event listening with context awareness.
 *
 * @template T - The type of the event arguments.
 * @param event - The signal to listen to.
 * @param discriminator - A unique value to additionally key by.
 * @param key - An automatically generated key to store the event state.
 * @returns An iterable function that yields event arguments.
 * @metadata macro
 */
export function useEvent<T extends Array<unknown>>(
	event: Signal<T>,
	discriminator?: unknown,
	key?: Modding.Caller<"uuid">,
): IterableFunction<T> {
	assert(key);

	const storage = useHookState<EventStorage<T>>(key, discriminator, cleanup);

	if (!storage.connection) {
		storage.events = [];
		const eventCallback: Callback<T> = (...args) => {
			storage.events.push(args);
		};

		if (typeIs(event, "function")) {
			storage.connection = event(eventCallback);
		} else if (event.connect !== undefined) {
			storage.connection = event.connect(eventCallback);
		} else if (event.Connect !== undefined) {
			storage.connection = event.Connect(eventCallback);
		} else if (event.on !== undefined) {
			storage.connection = event.on(eventCallback);
		} else {
			error("No connect method found on the event object.");
		}
	}

	return (() => storage.events.shift()) as IterableFunction<T>;
}
