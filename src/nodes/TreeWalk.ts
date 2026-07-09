import { HTMLCollection } from '../collections/HTMLCollection';
import { Element } from './Element';
import { Node } from './Node';

/**
 * Shared element tree-walk helpers used by Document, Element, and
 * DocumentFragment without introducing import cycles between node classes.
 *
 * Results are cached per-collection against the owning document's
 * _mutationVersion (the hot path for script-heavy pages that poll live
 * collections). When no version signal exists — e.g. a standalone
 * DocumentFragment with no ownerDocument, whose mutations never bump any
 * counter — caching is skipped entirely so collections stay live.
 */

function _mutationVersionOf(root: Node): number | null {
  const doc: any = (root as any).nodeType === 9 ? root : (root as any).ownerDocument;
  return doc && typeof doc._mutationVersion === 'number' ? doc._mutationVersion : null;
}

function _liveCollection(root: Node, match: (el: Element) => boolean): HTMLCollection {
  let cached: Node[] | null = null;
  let cachedVersion = -1;
  return new HTMLCollection(() => {
    const ver = _mutationVersionOf(root);
    if (ver !== null && cached !== null && cachedVersion === ver) return cached;
    const results: Node[] = [];
    _walkElements(root, (el: Element) => {
      if (match(el)) results.push(el);
    });
    if (ver !== null) {
      cached = results;
      cachedVersion = ver;
    }
    return results;
  });
}

/**
 * Returns a live HTMLCollection of elements matching all given class names,
 * scoped to the subtree rooted at `root`.
 */
export function _getElementsByClassName(root: Node, className: string): HTMLCollection {
  const requiredClasses = className.split(/\s+/).filter(c => c.length > 0);
  return _liveCollection(root, (el: Element) => {
    if (requiredClasses.length === 0) return false;
    const elClasses = el.className.split(/\s+/);
    return requiredClasses.every(rc => elClasses.includes(rc));
  });
}

/**
 * Returns a live HTMLCollection of elements matching the given tag name,
 * scoped to the subtree rooted at `root`. '*' matches all elements.
 * Tag comparison is case-insensitive.
 */
export function _getElementsByTagName(root: Node, tagName: string): HTMLCollection {
  const upper = tagName.toUpperCase();
  const matchAll = upper === '*';
  return _liveCollection(root, (el: Element) => matchAll || el.tagName === upper);
}

/** Depth-first pre-order walk of all Element descendants (excludes root). */
function _walkElements(node: Node, callback: (el: Element) => void): void {
  for (const child of node._children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      callback(child as Element);
    }
    _walkElements(child, callback);
  }
}
