import { Node } from './Node';
import { Element } from './Element';
import { Text } from './Text';
import { Comment } from './Comment';
import { DocumentFragment } from './DocumentFragment';
import { HTMLCollection } from '../collections/HTMLCollection';
import { NodeList } from './NodeList';
import { parseSelector, querySelectorAllElements, querySelectorFirstElement, _fastQueryFirst, _fastQueryAll } from '../selectors';

/**
 * Document — the root node of a DOM tree.
 *
 * Per the DOM Living Standard, Document has nodeType 9,
 * nodeName '#document', and serves as the factory for creating
 * all other node types. A new Document automatically wires up
 * the <html>, <head>, and <body> skeleton.
 */
export class Document extends Node {
  private _documentElement: Element;
  private _head: Element;
  private _body: Element;

  /** Points to the Window object when running inside a DixieEnvironment. */
  defaultView: any = null;

  /** Document visibility state. */
  readonly visibilityState: string = 'visible';

  /** Fast O(1) id→element index. Updated by Element.setAttribute/removeAttribute. */
  _idIndex: Map<string, Element> = new Map();

  /** Mutation version counter — incremented on any tree or attribute change. */
  _mutationVersion = 0;

  /** Cookie jar */
  private _cookies: Map<string, string> = new Map();

  /** Query caches — keyed by selector, validated against mutation version. */
  private _qsCache: Map<string, { v: number, r: Element | null }> = new Map();
  private _qsaCache: Map<string, { v: number, r: NodeList<Element> }> = new Map();

  constructor() {
    super(Node.DOCUMENT_NODE, '#document');

    // Auto-create the document skeleton: <html><head></head><body></body></html>
    this._documentElement = new Element('html');
    this._documentElement.ownerDocument = this;

    this._head = new Element('head');
    this._head.ownerDocument = this;

    this._body = new Element('body');
    this._body.ownerDocument = this;

    this._documentElement.appendChild(this._head);
    this._documentElement.appendChild(this._body);
    this.appendChild(this._documentElement);
  }

  // ── Document skeleton accessors ────────────────────────────────────

  get documentElement(): Element {
    return this._documentElement;
  }

  get head(): Element {
    return this._head;
  }

  get body(): Element {
    return this._body;
  }

  // ── title ──────────────────────────────────────────────────────────

  get title(): string {
    const titleEl = this._findTitleElement();
    return titleEl ? titleEl.textContent : '';
  }

  set title(value: string) {
    let titleEl = this._findTitleElement();
    if (!titleEl) {
      titleEl = this.createElement('title');
      this._head.appendChild(titleEl);
    }
    titleEl.textContent = value;
  }

  private _findTitleElement(): Element | null {
    for (const child of this._head._children) {
      if (child.nodeType === Node.ELEMENT_NODE && (child as Element).tagName === 'TITLE') {
        return child as Element;
      }
    }
    return null;
  }

  // ── cookie ───────────────────────────────────────────────────────

  get cookie(): string {
    return Array.from(this._cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  set cookie(value: string) {
    // Parse "name=value" from the cookie string (ignores path/domain/expires)
    const eqIndex = value.indexOf('=');
    if (eqIndex === -1) return;
    const name = value.slice(0, eqIndex).trim();
    const rest = value.slice(eqIndex + 1);
    // Value is everything up to the first semicolon
    const semiIndex = rest.indexOf(';');
    const val = semiIndex === -1 ? rest.trim() : rest.slice(0, semiIndex).trim();
    this._cookies.set(name, val);
  }

  // ── activeElement ──────────────────────────────────────────────

  get activeElement(): Element | null {
    return this._body;
  }

  // ── getSelection ──────────────────────────────────────────────

  getSelection(): any {
    return {
      anchorNode: null,
      anchorOffset: 0,
      focusNode: null,
      focusOffset: 0,
      isCollapsed: true,
      rangeCount: 0,
      type: 'None',
      addRange() {},
      removeAllRanges() {},
      removeRange() {},
      collapse() {},
      collapseToStart() {},
      collapseToEnd() {},
      extend() {},
      setBaseAndExtent() {},
      selectAllChildren() {},
      deleteFromDocument() {},
      getRangeAt() { return null; },
      containsNode() { return false; },
      toString() { return ''; },
    };
  }

  // ── createRange ─────────────────────────────────────────────────

  createRange(): any {
    const range = {
      startContainer: null as any,
      startOffset: 0,
      endContainer: null as any,
      endOffset: 0,
      collapsed: true,
      commonAncestorContainer: null as any,
      setStart(node: any, offset: number) {
        range.startContainer = node;
        range.startOffset = offset;
        range.collapsed = range.startContainer === range.endContainer && range.startOffset === range.endOffset;
      },
      setEnd(node: any, offset: number) {
        range.endContainer = node;
        range.endOffset = offset;
        range.collapsed = range.startContainer === range.endContainer && range.startOffset === range.endOffset;
      },
      setStartBefore(_node: any) {},
      setStartAfter(_node: any) {},
      setEndBefore(_node: any) {},
      setEndAfter(_node: any) {},
      selectNode(_node: any) {},
      selectNodeContents(_node: any) {},
      collapse(_toStart?: boolean) { range.collapsed = true; },
      cloneContents() { return new DocumentFragment(); },
      cloneRange() { return { ...range }; },
      deleteContents() {},
      extractContents() { return new DocumentFragment(); },
      insertNode(_node: any) {},
      surroundContents(_node: any) {},
      compareBoundaryPoints() { return 0; },
      detach() {},
      toString() { return ''; },
      getBoundingClientRect() {
        return { top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0, x: 0, y: 0 };
      },
      getClientRects() { return []; },
    };
    return range;
  }

  // ── Factory methods ────────────────────────────────────────────────

  createElement(tagName: string): Element {
    const el = new Element(tagName);
    el.ownerDocument = this;
    return el;
  }

  createElementNS(namespaceURI: string | null, qualifiedName: string): Element {
    const el = this.createElement(qualifiedName);
    if (namespaceURI) {
      (el as any)._namespaceURI = namespaceURI;
    }
    return el;
  }

  createTextNode(data: string): Text {
    const text = new Text(data);
    text.ownerDocument = this;
    return text;
  }

  createComment(data: string): Comment {
    const comment = new Comment(data);
    comment.ownerDocument = this;
    return comment;
  }

  createDocumentFragment(): DocumentFragment {
    const frag = new DocumentFragment();
    frag.ownerDocument = this;
    return frag;
  }

  // ── Query methods ──────────────────────────────────────────────────

  getElementById(id: string): Element | null {
    // Fast path: use the id index (only for unique IDs)
    const el = this._idIndex.get(id);
    if (el !== undefined) {
      // Verify this element is still in the tree (not detached) and ID hasn't changed
      if (el.parentNode && el.getAttribute('id') === id) return el;
      // Stale entry: remove and fall through to tree walk
      this._idIndex.delete(id);
    }
    // Fallback: tree walk (for duplicates or elements added without setAttribute)
    const found = this._walkForId(this, id);
    // Populate index if found and no duplicate exists
    if (found) this._idIndex.set(id, found);
    return found;
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

  // ── querySelector / querySelectorAll ─────────────────────────────────

  querySelector(selector: string): Element | null {
    // Fast path for #id — use the id index
    if (selector.length > 1 && selector.charCodeAt(0) === 35 /* '#' */ && selector.indexOf(' ') === -1 && selector.indexOf('.') === -1 && selector.indexOf('[') === -1) {
      const id = selector.slice(1);
      return this.getElementById(id);
    }
    // Cache check
    const ver = this._mutationVersion;
    const cached = this._qsCache.get(selector);
    if (cached && cached.v === ver) return cached.r;
    // Fast path for simple selectors
    const fast = _fastQueryFirst(this, selector);
    if (fast !== undefined) {
      this._qsCache.set(selector, { v: ver, r: fast });
      return fast;
    }
    const ast = parseSelector(selector);
    const result = querySelectorFirstElement(this, ast);
    this._qsCache.set(selector, { v: ver, r: result });
    return result;
  }

  querySelectorAll(selector: string): NodeList<Element> {
    // Cache check — returns the same NodeList object on repeat queries
    const ver = this._mutationVersion;
    const cached = this._qsaCache.get(selector);
    if (cached && cached.v === ver) return cached.r;
    // Fast path for simple selectors
    const fast = _fastQueryAll(this, selector);
    if (fast !== undefined) {
      const nl = new NodeList<Element>(fast);
      this._qsaCache.set(selector, { v: ver, r: nl });
      return nl;
    }
    const ast = parseSelector(selector);
    const elements = querySelectorAllElements(this, ast);
    const nl = new NodeList<Element>(elements);
    this._qsaCache.set(selector, { v: ver, r: nl });
    return nl;
  }
}

// ── Shared tree-walk helpers (used by both Document and Element) ──────

/**
 * Returns a live HTMLCollection of elements matching all given class names,
 * scoped to the subtree rooted at `root`.
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
 * Tag comparison is case-insensitive.
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

/** Depth-first walk of all Element descendants (excludes root). */
function _walkElements(node: Node, callback: (el: Element) => void): void {
  for (const child of node._children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      callback(child as Element);
    }
    _walkElements(child, callback);
  }
}
