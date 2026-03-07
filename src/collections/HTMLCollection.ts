import type { Node } from '../nodes/Node';

/**
 * HTMLCollection — a live collection of Element children.
 *
 * Unlike NodeList (which includes all node types), HTMLCollection
 * only contains Element nodes (nodeType === 1). It is "live" —
 * it reflects the current state of the parent's children on every access.
 *
 * The constructor takes a function that returns the current element children,
 * making it truly live without needing to maintain a separate array.
 */
export class HTMLCollection {
  private _getElements: () => Node[];

  constructor(getElements: () => Node[]) {
    this._getElements = getElements;

    // Proxy for indexed access (collection[0], collection[1], etc.)
    return new Proxy(this, {
      get(target, prop, receiver) {
        if (typeof prop === 'string') {
          const index = Number(prop);
          if (Number.isInteger(index) && index >= 0) {
            return target._getElements()[index] ?? undefined;
          }
        }
        return Reflect.get(target, prop, receiver);
      },
    });
  }

  get length(): number {
    return this._getElements().length;
  }

  item(index: number): Node | null {
    return this._getElements()[index] ?? null;
  }

  namedItem(name: string): Node | null {
    const elements = this._getElements();
    for (const el of elements) {
      // Check 'id' attribute first, then 'name' attribute
      if ((el as any).getAttribute?.('id') === name) return el;
      if ((el as any).getAttribute?.('name') === name) return el;
    }
    return null;
  }

  *[Symbol.iterator](): IterableIterator<Node> {
    const elements = this._getElements();
    for (const el of elements) {
      yield el;
    }
  }

  /** Allow indexed access via bracket notation — handled by Proxy. */
  [index: number]: Node;
}
