import type { Modding } from "@flamework/core";

import { useHookState } from "../topo";

interface ThrottleStorage {
	expiry: number;
	time?: number;
}

function cleanup(storage: ThrottleStorage): boolean {
	return os.clock() >= storage.expiry;
}

/**
 * Utility for easy time-based throttling.
 *
 * Accepts a duration and returns `true` if it has been that long since the last
 * time this function returned `true`. Always returns `true` the first time.
 *
 * @param seconds - The number of seconds to throttle for.
 * @param discriminator - An optional value to additionally key by.
 * @param key - An automatically generated key to store the throttle state.
 * @returns - Returns true every x seconds, otherwise false.
 * @metadata macro
 */
export function useThrottle(
	seconds: number,
	discriminator?: unknown,
	key?: Modding.Caller<"uuid">,
): boolean {
	assert(key);
	const storage = useHookState<ThrottleStorage>(key, discriminator, cleanup);

	const currentTime = os.clock();
	if (storage.time === undefined || currentTime - storage.time >= seconds) {
		storage.time = currentTime;
		storage.expiry = currentTime + seconds;
		return true;
	}

	return false;
}
