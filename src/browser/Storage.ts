/**
 * Web Storage API implementation for Dixie DOM engine.
 *
 * Implements the Storage interface (localStorage / sessionStorage)
 * with a Proxy wrapper for bracket-notation access.
 *
 * @see https://html.spec.whatwg.org/multipage/webstorage.html#the-storage-interface
 */

/** Set of property names that belong to the Storage prototype / instance. */
const RESERVED_PROPS = new Set<string | symbol>([
  'getItem',
  'setItem',
  'removeItem',
  'clear',
  'key',
  'length',
  'toString',
  // Internal
  '_store',
]);

class StorageImpl {
  /** Internal ordered map — Map preserves insertion order. */
  private _store: Map<string, string> = new Map();

  /** Number of key/value pairs currently present. */
  get length(): number {
    return this._store.size;
  }

  /**
   * Returns the name of the nth key, or null if index >= length.
   */
  key(index: number): string | null {
    if (index < 0 || index >= this._store.size) {
      return null;
    }
    let i = 0;
    for (const k of this._store.keys()) {
      if (i === index) return k;
      i++;
    }
    return null;
  }

  /**
   * Returns the current value associated with the given key,
   * or null if the key does not exist.
   */
  getItem(key: string): string | null {
    const val = this._store.get(key);
    return val === undefined ? null : val;
  }

  /**
   * Sets the value of the pair identified by key to value,
   * creating a new pair if none existed previously.
   * Values are coerced to string via String().
   */
  setItem(key: string, value: string): void {
    this._store.set(key, String(value));
  }

  /**
   * Removes the pair with the given key, if it exists.
   * No-op if the key does not exist.
   */
  removeItem(key: string): void {
    this._store.delete(key);
  }

  /**
   * Removes all key/value pairs.
   */
  clear(): void {
    this._store.clear();
  }

  toString(): string {
    return '[object Storage]';
  }

  /** Expose keys for the Proxy's ownKeys trap. */
  _keys(): string[] {
    return [...this._store.keys()];
  }

  /** Check if a data key exists (for the Proxy's has trap). */
  _has(key: string): boolean {
    return this._store.has(key);
  }
}

/**
 * Creates a new Storage instance wrapped in a Proxy that supports
 * bracket-notation access (read, write, delete, enumeration).
 *
 * Usage:
 * ```ts
 * const storage = createStorage();
 * storage.setItem('key', 'value');
 * storage['key'];           // 'value'
 * storage['other'] = '42';  // setItem('other', '42')
 * delete storage['other'];  // removeItem('other')
 * Object.keys(storage);     // ['key']
 * ```
 */
export function createStorage(): Storage {
  const impl = new StorageImpl();

  const proxy = new Proxy(impl, {
    get(target, prop, receiver) {
      // Reserved properties / methods go straight to the target
      if (RESERVED_PROPS.has(prop) || typeof prop === 'symbol') {
        const val = Reflect.get(target, prop, receiver);
        // Bind methods so `this` stays correct
        if (typeof val === 'function') {
          return val.bind(target);
        }
        return val;
      }

      // Also handle _keys and _has as internal
      if (prop === '_keys' || prop === '_has') {
        const val = Reflect.get(target, prop, receiver);
        if (typeof val === 'function') return val.bind(target);
        return val;
      }

      // For any other string property, look it up in the store
      const key = prop as string;
      const val = target.getItem(key);
      return val === null ? undefined : val;
    },

    set(target, prop, value) {
      // Don't allow overwriting reserved properties via bracket notation
      if (RESERVED_PROPS.has(prop) || typeof prop === 'symbol') {
        return true; // silently ignore
      }

      target.setItem(prop as string, value);
      return true;
    },

    deleteProperty(target, prop) {
      if (typeof prop === 'string') {
        target.removeItem(prop);
      }
      return true;
    },

    has(target, prop) {
      if (RESERVED_PROPS.has(prop) || typeof prop === 'symbol') {
        return prop in target;
      }
      return target._has(prop as string);
    },

    ownKeys(target) {
      return target._keys();
    },

    getOwnPropertyDescriptor(target, prop) {
      if (typeof prop === 'string' && target._has(prop)) {
        return {
          value: target.getItem(prop),
          writable: true,
          enumerable: true,
          configurable: true,
        };
      }
      return undefined;
    },
  });

  // Cast through unknown since StorageImpl isn't literally the global
  // Storage interface, but it implements the same shape.
  return proxy as unknown as Storage;
}
