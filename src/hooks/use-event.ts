import { Modding } from "@flamework/core";
import { useHookState } from "../topo";

type Disconnector = () => void;

type Connection =
	| {
			Disconnect?: Disconnector;
			disconnect?: Disconnector;
	  }
	| Disconnector;

type Callback<T extends unknown[]> = (...args: T) => void;

type Signal<T extends unknown[]> =
	| {
			connect?: (callback: Callback<T>) => Connection;
			Connect?: (callback: Callback<T>) => Connection;
			on?: (callback: Callback<T>) => Connection;
	  }
	| ((callback: Callback<T>) => Connection);

interface EventStorage<T extends unknown[]> {
	connection: Connection | undefined;
	events: T[];
}

function cleanup<T extends unknown[]>(storage: EventStorage<T>): boolean {
	if (storage.connection) {
		if (typeIs(storage.connection, "function")) {
			storage.connection();
		} else {
			(storage.connection.Disconnect || storage.connection.disconnect)!();
		}
	}
	return true;
}

/**
 * A hook for easy event listening with context awareness.
 *
 * @param event - The signal to listen to.
 * @param discriminator - A unique value to additionally key by.
 * @param key - An automatically generated key to store the event state.
 * @returns An iterable function that yields event arguments.
 * @metadata macro
 */
export function useEvent<T extends unknown[]>(
	event: Signal<T>,
	discriminator?: unknown,
	key?: Modding.Caller<"uuid">,
): IterableFunction<T> {
	assert(key, "Key is required for useEvent");

	const storage = useHookState<EventStorage<T>>(key, discriminator, cleanup);

	if (!storage.connection) {
		storage.events = [];
		const eventCallback: Callback<T> = (...args) => {
			storage.events.push(args);
		};

		storage.connection = typeIs(event, "function")
			? event(eventCallback)
			: (event.Connect || event.connect || event.on)!(eventCallback);
	}

	return (() => {
		if (storage.events.size() > 0) {
			return storage.events.shift()!;
		}
		return undefined;
	}) as IterableFunction<T>;
}
