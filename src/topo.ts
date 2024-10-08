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

export function start(node: Map<string, State<unknown>>, func: () => void): void {
	stack.push({ node });
	func();
	cleanupAll();
	stack.pop();
}

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
