export function createStore<T extends object>(storeObject: T) {
    const store = { ...storeObject };

    return {
        get(key: keyof T): T[keyof T] {
            return store[key];
        },

        set<K extends keyof T>(key: K, value: T[K]): void {
            store[key] = value;
        },

        has(key: string): boolean {
            return key in store;
        },

        delete(key: keyof T): boolean {
            return delete store[key];
        }
    };
}