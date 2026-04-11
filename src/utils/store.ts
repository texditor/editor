/**
 * Creates a simple key-value store from an object
 * @param storeObject - Initial object to use as the store
 * @returns Store object with get, set, has, and delete methods
 */
export function createStore<T extends object>(storeObject: T) {
    const store = { ...storeObject };

    return {
        /**
         * Retrieves a value from the store
         * @param key - The key to retrieve
         * @returns The value associated with the key
         */
        get(key: keyof T): T[keyof T] {
            return store[key];
        },

        /**
         * Sets a value in the store
         * @param key - The key to set
         * @param value - The value to store
         */
        set<K extends keyof T>(key: K, value: T[K]): void {
            store[key] = value;
        },

        /**
         * Checks if a key exists in the store
         * @param key - The key to check
         * @returns True if the key exists, false otherwise
         */
        has(key: string): boolean {
            return key in store;
        },

        /**
         * Deletes a key from the store
         * @param key - The key to delete
         * @returns True if the key was deleted, false otherwise
         */
        delete(key: keyof T): boolean {
            return delete store[key];
        }
    };
}