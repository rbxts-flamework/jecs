import type { Modding } from "@flamework/core";

import { useHookState } from "../topo";

type Callback<T extends Array<unknown>> = (...args: T) => void;

type EventLike<T extends Array<unknown> = Array<unknown>> =
	| ((callback: Callback<T>) => ConnectionLike)
	| { Connect(callback: Callback<T>): ConnectionLike }
	| { connect(callback: Callback<T>): ConnectionLike }
	| { on(callback: Callback<T>): ConnectionLike };

type ConnectionLike = (() => void) | { Disconnect(): void } | { disconnect(): void };

interface EventStorage<T extends Array<unknown>> {
	connection?: ConnectionLike;
	events: Array<T>;
}

function connect<T extends Array<unknown>>(
	event: EventLike<T>,
	callback: Callback<T>,
): ConnectionLike {
	if (typeIs(event, "function")) {
		return event(callback);
	} else if (typeIs(event, "RBXScriptSignal") || "Connect" in event) {
		return event.Connect(callback);
	} else if ("connect" in event) {
		return event.connect(callback);
	} else if ("on" in event) {
		return event.on(callback);
	}

	throw "Event-like object does not have a supported connect method.";
}

function disconnect(connection: ConnectionLike): void {
	if (typeIs(connection, "function")) {
		connection();
	} else if (typeIs(connection, "RBXScriptConnection") || "Disconnect" in connection) {
		connection.Disconnect();
	} else if ("disconnect" in connection) {
		connection.disconnect();
	} else {
		throw "Connection-like object does not have a supported disconnect method.";
	}
}

function cleanup<T extends Array<unknown>>(storage: EventStorage<T>): boolean {
	if (storage.connection) {
		disconnect(storage.connection);
	}

	return true;
}

/**
 * Utility for handling event-like objects.
 *
 * Connects to the provided event-like object and stores incoming events.
 * Returns an iterable function that yields the stored events in the order they
 * were received.
 *
 * @template T - The tuple type of event arguments.
 * @param event - The event-like object to connect to.
 * @param discriminator - An optional value to additionally key by.
 * @param key - An automatically generated key to store the event state.
 * @returns An iterable function that yields stored events.
 * @metadata macro
 */
export function useEvent<T extends Array<unknown>>(
	event: EventLike<T>,
	discriminator?: unknown,
	key?: Modding.Caller<"uuid">,
): IterableFunction<T> {
	assert(key);

	const storage = useHookState<EventStorage<T>>(key, discriminator, cleanup);

	if (!storage.connection) {
		storage.events = [];
		storage.connection = connect(event, (...args) => storage.events.push(args));
	}

	return (() => storage.events.shift()) as IterableFunction<T>;
}
