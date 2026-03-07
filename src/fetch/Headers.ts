/**
 * DixieHeaders — Minimal Headers implementation for the CLI browser.
 *
 * Case-insensitive header name lookup. Supports append (multi-value via comma join).
 * Iterable via entries(), keys(), values(), forEach().
 */

export class DixieHeaders {
  private _map: Map<string, string> = new Map();
  /** Preserves the original casing of the first set/append call for each header */
  private _names: Map<string, string> = new Map();

  constructor(init?: Record<string, string> | [string, string][] | DixieHeaders) {
    if (!init) return;

    if (init instanceof DixieHeaders) {
      init.forEach((value, key) => {
        this.set(key, value);
      });
    } else if (Array.isArray(init)) {
      for (const [key, value] of init) {
        this.append(key, value);
      }
    } else {
      for (const key of Object.keys(init)) {
        this.set(key, init[key]);
      }
    }
  }

  private _normalise(name: string): string {
    return name.toLowerCase();
  }

  get(name: string): string | null {
    return this._map.get(this._normalise(name)) ?? null;
  }

  set(name: string, value: string): void {
    const norm = this._normalise(name);
    this._map.set(norm, value);
    if (!this._names.has(norm)) {
      this._names.set(norm, name);
    }
  }

  has(name: string): boolean {
    return this._map.has(this._normalise(name));
  }

  delete(name: string): void {
    const norm = this._normalise(name);
    this._map.delete(norm);
    this._names.delete(norm);
  }

  append(name: string, value: string): void {
    const norm = this._normalise(name);
    const existing = this._map.get(norm);
    if (existing !== undefined) {
      this._map.set(norm, existing + ', ' + value);
    } else {
      this._map.set(norm, value);
      this._names.set(norm, name);
    }
  }

  forEach(callback: (value: string, key: string, headers: DixieHeaders) => void): void {
    this._map.forEach((value, normKey) => {
      callback(value, normKey, this);
    });
  }

  *entries(): IterableIterator<[string, string]> {
    for (const [normKey, value] of this._map) {
      yield [normKey, value];
    }
  }

  *keys(): IterableIterator<string> {
    for (const normKey of this._map.keys()) {
      yield normKey;
    }
  }

  *values(): IterableIterator<string> {
    for (const value of this._map.values()) {
      yield value;
    }
  }

  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries();
  }
}
