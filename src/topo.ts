type Cleanup<T> = (state: T) => boolean;

interface State<T> {
	cleanup: Cleanup<T>;
	state: Record<string, T>;
}

interface StackFrame {
	node: Record<string, State<unknown>>;
	accessedKeys: Set<string>;
}

const stack: StackFrame[] = [];

function cleanupAll(): void {
	const current = stack[stack.size() - 1]!;

	for (const [key, state] of pairs(current.node)) {
		for (const [discriminator, value] of pairs(state.state)) {
			const compositeKey = `${key}:${discriminator}`;
			if (!current.accessedKeys.has(compositeKey) && state.cleanup(value)) {
				delete state.state[discriminator];
			}
		}
	}
}

/**
 * Starts a new stack frame for a function, ensuring cleanup after execution.
 * Intended to be used in systems.
 *
 * @param node - The node to store the state for the current function.
 * @param func - The function to execute within the new stack frame.
 * @returns - The function to execute within the new stack frame.
 */
export function start(node: Record<string, State<unknown>>, func: () => void): void {
	stack.push({ node, accessedKeys: new Set() });
	func();
	cleanupAll();
	stack.pop();
}

/**
 * Creates or retrieves a state object for a hook, keyed by a unique identifier.
 *
 * @param key A unique string identifier for the hook state.
 * @param discriminator An optional value to further distinguish different states within the same key. Defaults to the key itself.
 * @param cleanup A function that determines whether the state should be cleaned up. It should return true if the state should be removed.
 * @returns The state object of type T.
 */
export function useHookState<T>(key: string, discriminator: unknown = key, cleanup: Cleanup<T>): T {
	const current = stack[stack.size() - 1]!;
	let storage = current.node[key] as State<T> | undefined;

	if (!storage) {
		storage = { cleanup, state: {} };
		current.node[key] = storage as State<unknown>;
	}

	const stringifiedKey = tostring(discriminator);
	const compositeKey = `${key}:${stringifiedKey}`;
	current.accessedKeys.add(compositeKey);

	let state = storage.state[stringifiedKey];

	if (state === undefined) {
		state = {} as T;
		storage.state[stringifiedKey] = state;
	}

	return state;
}
