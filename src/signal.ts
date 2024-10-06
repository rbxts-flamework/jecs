export interface Signal<T extends Array<unknown>> {
    connect: (func: (...args: T) => void) => void;
    fire: (...args: T) => void;
}


export function createSignal<T extends Array<unknown>>(): Signal<T> {
    const listeners = new Array<(...args: T) => void>();
    const fire = (...args: T): void => {
        for (const func of listeners) {
            func(...args);
        }
    };

    const connect = (func: (...args: T) => void): void => {
        listeners.push(func);
    };

    return {
        connect,
        fire,
    };
}
