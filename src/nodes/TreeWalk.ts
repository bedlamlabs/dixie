import { HTMLCollection } from '../collections/HTMLCollection';
import { Element } from './Element';
import { Node } from './Node';

/**
 * Shared element tree-walk helpers used by Document, Element, and
 * DocumentFragment without introducing import cycles between node classes.
 */
export function _getElementsByClassName(root: Node, className: string): HTMLCollection {
  const requiredClasses = className.split(/\s+/).filter(c => c.length > 0);
  return new HTMLCollection(() => {
    const results: Node[] = [];
    _walkElements(root, (el: Element) => {
      if (requiredClasses.length === 0) return;
      const elClasses = el.className.split(/\s+/);
      if (requiredClasses.every(rc => elClasses.includes(rc))) {
        results.push(el);
      }
    });
    return results;
  });
}

/**
 * Returns a live HTMLCollection of elements matching the given tag name,
 * scoped to the subtree rooted at `root`. '*' matches all elements.
 */
export function _getElementsByTagName(root: Node, tagName: string): HTMLCollection {
  const upper = tagName.toUpperCase();
  const matchAll = upper === '*';
  return new HTMLCollection(() => {
    const results: Node[] = [];
    _walkElements(root, (el: Element) => {
      if (matchAll || el.tagName === upper) {
        results.push(el);
      }
    });
    return results;
  });
}

function _walkElements(node: Node, callback: (el: Element) => void): void {
  for (const child of node._children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      callback(child as Element);
    }
    _walkElements(child, callback);
  }
}
