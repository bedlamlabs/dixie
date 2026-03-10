import { Attr } from '../nodes/Attr';

/**
 * NamedNodeMap — an ordered collection of Attr objects.
 *
 * Provides indexed access, named lookup, and iteration.
 * Attribute names are stored lowercase for HTML case-insensitivity.
 */
export class NamedNodeMap {
  /** Internal ordered list of attributes. */
  _attrs: Attr[] = [];
  /** O(1) name → Attr lookup (kept in sync with _attrs). */
  private _map: Map<string, Attr> = new Map();

  constructor() {
    // Return a Proxy so numeric indexing (attributes[0]) works like a real NamedNodeMap
    return new Proxy(this, {
      get(target, prop, receiver) {
        if (typeof prop === 'string' && /^\d+$/.test(prop)) {
          return target._attrs[Number(prop)];
        }
        return Reflect.get(target, prop, receiver);
      },
    });
  }

  get length(): number {
    return this._attrs.length;
  }

  item(index: number): Attr | null {
    return this._attrs[index] ?? null;
  }

  getNamedItem(name: string): Attr | null {
    return this._map.get(name.toLowerCase()) ?? null;
  }

  setNamedItem(attr: Attr): Attr | null {
    const existing = this._map.get(attr.name);
    if (existing) {
      const idx = this._attrs.indexOf(existing);
      this._attrs[idx] = attr;
      this._map.set(attr.name, attr);
      return existing;
    }
    this._attrs.push(attr);
    this._map.set(attr.name, attr);
    return null;
  }

  removeNamedItem(name: string): Attr {
    const lower = name.toLowerCase();
    const existing = this._map.get(lower);
    if (!existing) {
      throw new DOMException(
        `Failed to execute 'removeNamedItem' on 'NamedNodeMap': No attribute named '${name}' was found.`,
        'NotFoundError',
      );
    }
    const idx = this._attrs.indexOf(existing);
    this._attrs.splice(idx, 1);
    this._map.delete(lower);
    existing.ownerElement = null;
    return existing;
  }

  [Symbol.iterator](): IterableIterator<Attr> {
    return this._attrs[Symbol.iterator]();
  }
}
