type Cleanup<T> = (state: T) => boolean;

interface State<T> {
	cleanup: Cleanup<T>;
	state: Map<string, T>;
}

interface StackFrame {
	node: Map<string, State<unknown>>;
}

const stack: StackFrame[] = [];

function cleanupAll(): void {
	const current = stack[stack.size() - 1]!;

	for (const [, state] of current.node) {
		for (const [discriminator, value] of state.state) {
			if (state.cleanup(value)) {
				state.state.delete(discriminator);
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
export function start(node: Map<string, State<unknown>>, func: () => void): void {
	stack.push({ node });
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
	let storage = current.node.get(key) as State<T> | undefined;

	if (!storage) {
		storage = { cleanup, state: new Map() };
		current.node.set(key, storage as State<unknown>);
	}

	const stringifiedKey = tostring(discriminator);
	let state = storage.state.get(stringifiedKey);

	if (state === undefined) {
		state = {} as T;
		storage.state.set(stringifiedKey, state);
	}

	return state;
}
