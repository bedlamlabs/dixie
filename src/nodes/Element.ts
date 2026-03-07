import { Node } from './Node';
import { Text } from './Text';
import { Attr } from './Attr';
import { NodeList } from './NodeList';
import { NamedNodeMap } from '../collections/NamedNodeMap';
import { DOMTokenList } from '../collections/DOMTokenList';
import { HTMLCollection } from '../collections/HTMLCollection';
import { CSSStyleDeclaration } from '../css/CSSStyleDeclaration';
import { _getElementsByClassName, _getElementsByTagName } from './Document';
import { parseHTML } from '../parser/HTMLParser';
import { serializeHTML } from '../parser/HTMLSerializer';
import {
  parseSelector,
  matchesSelector,
  querySelectorAllElements,
  querySelectorFirstElement,
  _fastQueryFirst,
  _fastQueryAll,
} from '../selectors';

/**
 * Element — a DOM element node (e.g. <div>, <span>, <p>).
 *
 * Extends Node with attribute handling, classList, element-specific
 * child traversal, and convenience mutation methods (append, prepend,
 * after, before, remove, replaceWith).
 *
 * tagName is stored uppercase per the HTML spec.
 */
export class Element extends Node {
  readonly tagName: string;

  /** Namespace URI, set by Document.createElementNS */
  _namespaceURI: string | null = null;

  private _attributes: NamedNodeMap;
  private _classList: DOMTokenList | null = null;
  private _style: CSSStyleDeclaration | null = null;
  private _children_collection: HTMLCollection | null = null;

  /** Query cache — keyed by selector, validated against document mutation version. */
  private _qsaCache: Map<string, { v: number, r: NodeList<Element> }> | null = null;
  private _qsCache: Map<string, { v: number, r: Element | null }> | null = null;

  constructor(tagName: string) {
    const upper = tagName.toUpperCase();
    super(Node.ELEMENT_NODE, upper);
    this.tagName = upper;
    this._attributes = new NamedNodeMap();
  }

  get namespaceURI(): string | null {
    return this._namespaceURI;
  }

  getBoundingClientRect(): { top: number; right: number; bottom: number; left: number; width: number; height: number; x: number; y: number } {
    return { top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0, x: 0, y: 0 };
  }

  getClientRects(): any[] {
    return [this.getBoundingClientRect()];
  }

  // ── Focus / interaction stubs ──────────────────────────────────────

  focus(_options?: any): void {}
  blur(): void {}
  click(): void {}
  scrollIntoView(_arg?: any): void {}

  // ── Select element support ─────────────────────────────────────────

  get options(): any[] {
    if (this.tagName !== 'SELECT') return [];
    const opts: Element[] = [];
    for (const child of this._children) {
      if (child.nodeType === Node.ELEMENT_NODE && (child as Element).tagName === 'OPTION') {
        opts.push(child as Element);
      }
    }
    return opts;
  }

  get selectedIndex(): number {
    return -1;
  }

  set selectedIndex(_value: number) {}

  get selected(): boolean {
    return false;
  }

  set selected(_value: boolean) {}

  get disabled(): boolean {
    return this.hasAttribute('disabled');
  }

  set disabled(value: boolean) {
    if (value) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  get defaultSelected(): boolean {
    return false;
  }

  set defaultSelected(_value: boolean) {}

  // ── Attributes ──────────────────────────────────────────────────────

  /**
   * Fast attribute setter for the parser. Assumes:
   * - name is already lowercase
   * - no existing attribute with this name on the element
   * - value is already a string
   * Skips getNamedItem lookup, toLowerCase, and id-index checks.
   * The id-index is updated separately after all attributes are set.
   */
  _setAttributeFast(name: string, value: string): void {
    const attr = new Attr(name, value);
    attr.ownerElement = this;
    this._attributes._attrs.push(attr);
  }

  get attributes(): NamedNodeMap {
    return this._attributes;
  }

  getAttribute(name: string): string | null {
    const attr = this._attributes.getNamedItem(name);
    return attr ? attr.value : null;
  }

  setAttribute(name: string, value: string): void {
    const lower = name.toLowerCase();
    const strValue = String(value);
    const existing = this._attributes.getNamedItem(lower);
    if (existing) {
      // Update id index if changing an id
      if (lower === 'id') {
        const doc = this.ownerDocument;
        if (doc && doc._idIndex) {
          const oldId = existing.value;
          if (oldId && doc._idIndex.get(oldId) === this) {
            doc._idIndex.delete(oldId);
          }
          if (strValue && !doc._idIndex.has(strValue)) {
            doc._idIndex.set(strValue, this);
          }
        }
      }
      existing.value = strValue;
      this._notifyMutation();
    } else {
      const attr = new Attr(lower, strValue);
      attr.ownerElement = this;
      this._attributes.setNamedItem(attr);
      // Update id index for new id attribute — only if no other element owns this ID
      if (lower === 'id' && strValue) {
        const doc = this.ownerDocument;
        if (doc && doc._idIndex && !doc._idIndex.has(strValue)) {
          doc._idIndex.set(strValue, this);
        }
      }
      this._notifyMutation();
    }
  }

  removeAttribute(name: string): void {
    const lower = name.toLowerCase();
    const attr = this._attributes.getNamedItem(lower);
    if (attr) {
      // Update id index if removing an id
      if (lower === 'id') {
        const doc = this.ownerDocument;
        if (doc && doc._idIndex) {
          const oldId = attr.value;
          if (oldId && doc._idIndex.get(oldId) === this) {
            doc._idIndex.delete(oldId);
          }
        }
      }
      this._attributes.removeNamedItem(lower);
      this._notifyMutation();
    }
  }

  hasAttribute(name: string): boolean {
    return this._attributes.getNamedItem(name) !== null;
  }

  // ── id / className ──────────────────────────────────────────────────

  get id(): string {
    return this.getAttribute('id') ?? '';
  }

  set id(value: string) {
    this.setAttribute('id', value);
  }

  get className(): string {
    return this.getAttribute('class') ?? '';
  }

  set className(value: string) {
    this.setAttribute('class', value);
  }

  // ── classList ───────────────────────────────────────────────────────

  get classList(): DOMTokenList {
    if (!this._classList) {
      this._classList = new DOMTokenList(
        () => this.getAttribute('class') ?? '',
        (value: string) => this.setAttribute('class', value),
      );
    }
    return this._classList;
  }

  // ── style ──────────────────────────────────────────────────────────

  get style(): CSSStyleDeclaration {
    if (!this._style) {
      this._style = new CSSStyleDeclaration(
        this.getAttribute('style') ?? undefined,
        this,
      );
    }
    return this._style;
  }

  // ── Element child traversal ─────────────────────────────────────────

  get children(): HTMLCollection {
    if (!this._children_collection) {
      this._children_collection = new HTMLCollection(
        () => this._children.filter(c => c.nodeType === Node.ELEMENT_NODE),
      );
    }
    return this._children_collection;
  }

  get childElementCount(): number {
    return this._children.filter(c => c.nodeType === Node.ELEMENT_NODE).length;
  }

  get firstElementChild(): Element | null {
    for (const child of this._children) {
      if (child.nodeType === Node.ELEMENT_NODE) return child as Element;
    }
    return null;
  }

  get lastElementChild(): Element | null {
    for (let i = this._children.length - 1; i >= 0; i--) {
      if (this._children[i].nodeType === Node.ELEMENT_NODE) return this._children[i] as Element;
    }
    return null;
  }

  get nextElementSibling(): Element | null {
    let sibling = this.nextSibling;
    while (sibling) {
      if (sibling.nodeType === Node.ELEMENT_NODE) return sibling as Element;
      sibling = sibling.nextSibling;
    }
    return null;
  }

  get previousElementSibling(): Element | null {
    let sibling = this.previousSibling;
    while (sibling) {
      if (sibling.nodeType === Node.ELEMENT_NODE) return sibling as Element;
      sibling = sibling.previousSibling;
    }
    return null;
  }

  // ── Convenience mutation methods ────────────────────────────────────

  /**
   * Convert a Node-or-string argument to a Node.
   * Strings become Text nodes per the DOM spec.
   */
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

  after(...nodes: (Node | string)[]): void {
    const parent = this.parentNode;
    if (!parent) return;
    const nextSib = this.nextSibling;
    for (const item of nodes) {
      const node = this._coerceNode(item);
      parent.insertBefore(node, nextSib);
    }
  }

  before(...nodes: (Node | string)[]): void {
    const parent = this.parentNode;
    if (!parent) return;
    for (const item of nodes) {
      const node = this._coerceNode(item);
      parent.insertBefore(node, this);
    }
  }

  remove(): void {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  }

  replaceWith(...nodes: (Node | string)[]): void {
    const parent = this.parentNode;
    if (!parent) return;
    const nextSib = this.nextSibling;
    // Remove self first
    parent.removeChild(this);
    // Insert replacement nodes
    for (const item of nodes) {
      const node = this._coerceNode(item);
      parent.insertBefore(node, nextSib);
    }
  }

  // ── Query methods ──────────────────────────────────────────────────

  getElementsByClassName(className: string): HTMLCollection {
    return _getElementsByClassName(this, className);
  }

  getElementsByTagName(tagName: string): HTMLCollection {
    return _getElementsByTagName(this, tagName);
  }

  querySelector(selector: string): Element | null {
    // Cache check
    const doc = this.ownerDocument;
    const ver = doc ? doc._mutationVersion : -1;
    if (doc) {
      if (!this._qsCache) this._qsCache = new Map();
      const cached = this._qsCache.get(selector);
      if (cached && cached.v === ver) return cached.r;
    }
    // Fast paths for simple selectors
    const fast = _fastQueryFirst(this, selector);
    if (fast !== undefined) {
      if (doc) this._qsCache!.set(selector, { v: ver, r: fast });
      return fast;
    }
    const ast = parseSelector(selector);
    const result = querySelectorFirstElement(this, ast);
    if (doc) this._qsCache!.set(selector, { v: ver, r: result });
    return result;
  }

  querySelectorAll(selector: string): NodeList<Element> {
    // Cache check — returns the same NodeList object on repeat queries
    const doc = this.ownerDocument;
    const ver = doc ? doc._mutationVersion : -1;
    if (doc) {
      if (!this._qsaCache) this._qsaCache = new Map();
      const cached = this._qsaCache.get(selector);
      if (cached && cached.v === ver) return cached.r;
    }
    // Fast paths for simple selectors
    const fast = _fastQueryAll(this, selector);
    if (fast !== undefined) {
      const nl = new NodeList<Element>(fast);
      if (doc) this._qsaCache!.set(selector, { v: ver, r: nl });
      return nl;
    }
    const ast = parseSelector(selector);
    const elements = querySelectorAllElements(this, ast);
    const nl = new NodeList<Element>(elements);
    if (doc) this._qsaCache!.set(selector, { v: ver, r: nl });
    return nl;
  }

  matches(selector: string): boolean {
    const ast = parseSelector(selector);
    return matchesSelector(this, ast);
  }

  closest(selector: string): Element | null {
    const ast = parseSelector(selector);
    let current: Node | null = this;
    while (current) {
      if (current.nodeType === Node.ELEMENT_NODE) {
        if (matchesSelector(current as Element, ast)) {
          return current as Element;
        }
      }
      current = current.parentNode;
    }
    return null;
  }

  // ── Clone ──────────────────────────────────────────────────────────

  cloneNode(deep?: boolean): Element {
    const clone = new Element(this.tagName);
    clone.ownerDocument = this.ownerDocument;
    // Copy attributes
    for (const attr of this._attributes) {
      clone.setAttribute(attr.name, attr.value);
    }
    if (deep) {
      for (const child of this._children) {
        clone.appendChild(child.cloneNode(true));
      }
    }
    return clone;
  }

  // ── textContent override ───────────────────────────────────────────

  set textContent(value: string) {
    if (value == null) value = '';
    // Remove all children
    while (this._children.length > 0) {
      this.removeChild(this._children[0]);
    }
    if (value !== '') {
      this.appendChild(new Text(value));
    }
  }

  get textContent(): string {
    let text = '';
    for (const child of this._children) {
      if (child.nodeType !== Node.COMMENT_NODE) {
        text += child.textContent;
      }
    }
    return text;
  }

  // ── innerHTML ─────────────────────────────────────────────────────

  get innerHTML(): string {
    let html = '';
    for (const child of this._children) {
      html += serializeHTML(child);
    }
    return html;
  }

  set innerHTML(html: string) {
    // Fast-clear all children: detach each child and truncate array
    const children = this._children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      child.parentNode = null;
      child.previousSibling = null;
      child.nextSibling = null;
    }
    children.length = 0;

    if (html === '') {
      this._notifyMutation();
      return;
    }

    // Get a Document to use as factory
    const doc = this._getOwnerDocument();
    const nodes = parseHTML(html, doc);
    // Batch-append: wire up children directly without removeChild checks
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const prev = i > 0 ? nodes[i - 1] : null;
      if (prev) {
        prev.nextSibling = node;
        node.previousSibling = prev;
      } else {
        node.previousSibling = null;
      }
      node.nextSibling = null;
      node.parentNode = this;
      children.push(node);
    }
    this._notifyMutation();
  }

  // ── outerHTML ─────────────────────────────────────────────────────

  get outerHTML(): string {
    return serializeHTML(this);
  }

  set outerHTML(html: string) {
    const parent = this.parentNode;
    if (!parent) {
      throw new DOMException(
        "Failed to set the 'outerHTML' property on 'Element': This element has no parent node.",
        'NoModificationAllowedError',
      );
    }

    const doc = this._getOwnerDocument();
    const nodes = parseHTML(html, doc);
    const nextSib = this.nextSibling;

    parent.removeChild(this);
    for (const node of nodes) {
      parent.insertBefore(node, nextSib);
    }
  }

  // ── Internal helpers ──────────────────────────────────────────────

  private _getOwnerDocument(): any {
    if (this.ownerDocument) return this.ownerDocument;
    // Fallback: create a minimal Document
    const { Document } = require('./Document');
    return new Document();
  }
}
