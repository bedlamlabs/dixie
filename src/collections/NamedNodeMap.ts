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

  get length(): number {
    return this._attrs.length;
  }

  item(index: number): Attr | null {
    return this._attrs[index] ?? null;
  }

  getNamedItem(name: string): Attr | null {
    const lower = name.toLowerCase();
    const attrs = this._attrs;
    for (let i = 0, len = attrs.length; i < len; i++) {
      if (attrs[i].name === lower) return attrs[i];
    }
    return null;
  }

  setNamedItem(attr: Attr): Attr | null {
    const existing = this.getNamedItem(attr.name);
    if (existing) {
      const old = existing;
      const idx = this._attrs.indexOf(existing);
      this._attrs[idx] = attr;
      return old;
    }
    this._attrs.push(attr);
    return null;
  }

  removeNamedItem(name: string): Attr {
    const lower = name.toLowerCase();
    const idx = this._attrs.findIndex(a => a.name === lower);
    if (idx === -1) {
      throw new DOMException(
        `Failed to execute 'removeNamedItem' on 'NamedNodeMap': No attribute named '${name}' was found.`,
        'NotFoundError',
      );
    }
    const [removed] = this._attrs.splice(idx, 1);
    removed.ownerElement = null;
    return removed;
  }

  [Symbol.iterator](): IterableIterator<Attr> {
    return this._attrs[Symbol.iterator]();
  }
}
