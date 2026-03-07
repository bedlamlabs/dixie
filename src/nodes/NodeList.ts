/**
 * Live NodeList — reflects the current state of a parent node's children.
 *
 * Rather than copying the array, NodeList holds a reference to the parent's
 * internal children array. Any mutation to the parent's children is
 * immediately visible through this NodeList. This matches the DOM spec
 * behavior where childNodes is a "live" collection.
 */
export class NodeList<T = any> {
  /** The backing array — owned by the parent Node, shared by reference. */
  _items: T[];

  /** Whether this is a live node list (childNodes) vs static (querySelectorAll). */
  private _live: boolean;

  constructor(backingArray: T[], live?: boolean) {
    this._items = backingArray;
    this._live = live ?? false;

    if (this._live) {
      // Live NodeList (childNodes): use Proxy for dynamic indexed access
      return new Proxy(this, {
        get(target, prop, receiver) {
          if (typeof prop === 'string') {
            const index = Number(prop);
            if (Number.isInteger(index) && index >= 0) {
              return target._items[index] ?? undefined;
            }
          }
          return Reflect.get(target, prop, receiver);
        },
      });
    } else {
      // Static NodeList (querySelectorAll): assign indexed properties directly
      for (let i = 0, len = backingArray.length; i < len; i++) {
        (this as any)[i] = backingArray[i];
      }
    }
  }

  get length(): number {
    return this._items.length;
  }

  item(index: number): T | null {
    return this._items[index] ?? null;
  }

  forEach(callback: (value: T, index: number, list: NodeList<T>) => void, thisArg?: any): void {
    for (let i = 0; i < this._items.length; i++) {
      callback.call(thisArg, this._items[i], i, this);
    }
  }

  *entries(): IterableIterator<[number, T]> {
    for (let i = 0; i < this._items.length; i++) {
      yield [i, this._items[i]];
    }
  }

  *keys(): IterableIterator<number> {
    for (let i = 0; i < this._items.length; i++) {
      yield i;
    }
  }

  *values(): IterableIterator<T> {
    for (let i = 0; i < this._items.length; i++) {
      yield this._items[i];
    }
  }

  [Symbol.iterator](): IterableIterator<T> {
    return this.values();
  }

  /** Allow indexed access via bracket notation — handled by Proxy. */
  [index: number]: T;
}
