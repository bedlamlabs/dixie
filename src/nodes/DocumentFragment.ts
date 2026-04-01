import { Node } from './Node';
import { Element } from './Element';
import { Text } from './Text';
import { _getElementsByClassName, _getElementsByTagName } from './Document';
import { HTMLCollection } from '../collections/HTMLCollection';
import { NodeList } from './NodeList';
import { parseSelector, querySelectorAllElements, querySelectorFirstElement } from '../selectors';

/**
 * DocumentFragment — a lightweight DOM container for batch mutations.
 *
 * Per the DOM Living Standard, DocumentFragment has nodeType 11,
 * nodeName '#document-fragment'. When a fragment is appended to
 * another node, its children are moved (not copied) into the target,
 * leaving the fragment empty.
 */
export class DocumentFragment extends Node {
  constructor() {
    super(Node.DOCUMENT_FRAGMENT_NODE, '#document-fragment');

    const activeDocument =
      typeof globalThis !== 'undefined' &&
      'document' in globalThis &&
      (globalThis as Record<string, unknown>).document &&
      typeof (globalThis as { document?: { createElement?: unknown } }).document?.createElement === 'function'
        ? (globalThis as unknown as { document: unknown }).document
        : null;

    if (activeDocument) {
      this.ownerDocument = activeDocument;
    }
  }

  // ── Convenience mutation methods ───────────────────────────────────

  private _coerceNode(item: Node | string): Node {
    if (typeof item === 'string') {
      return new Text(item);
    }
    return item;
  }

  append(...nodes: (Node | string)[]): void {
    for (const item of nodes) {
      this.appendChild(this._coerceNode(item));
    }
  }

  prepend(...nodes: (Node | string)[]): void {
    const firstChild = this.firstChild;
    for (const item of nodes) {
      const node = this._coerceNode(item);
      if (firstChild) {
        this.insertBefore(node, firstChild);
      } else {
        this.appendChild(node);
      }
    }
  }

  // ── Query methods ──────────────────────────────────────────────────

  getElementById(id: string): Element | null {
    return this._walkForId(this, id);
  }

  private _walkForId(node: Node, id: string): Element | null {
    for (const child of node._children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        if ((child as Element).id === id) return child as Element;
        const found = this._walkForId(child, id);
        if (found) return found;
      }
    }
    return null;
  }

  getElementsByClassName(className: string): HTMLCollection {
    return _getElementsByClassName(this, className);
  }

  getElementsByTagName(tagName: string): HTMLCollection {
    return _getElementsByTagName(this, tagName);
  }

  querySelector(selector: string): Element | null {
    const ast = parseSelector(selector);
    return querySelectorFirstElement(this, ast);
  }

  querySelectorAll(selector: string): NodeList<Element> {
    const ast = parseSelector(selector);
    const elements = querySelectorAllElements(this, ast);
    return new NodeList<Element>([...elements]);
  }
}
