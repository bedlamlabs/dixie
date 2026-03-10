/**
 * SelectorMatcher — matches a parsed CSS selector AST against DOM elements.
 *
 * Core API:
 * - matchesSelector(element, selectorList) — does the element match?
 * - querySelectorAll(root, selectorList) — find all matching descendants
 * - querySelector(root, selectorList) — find first matching descendant
 *
 * Supports combinators: descendant, child, adjacent sibling (+), general sibling (~)
 * Supports pseudo-classes: :first-child, :last-child, :nth-child(), :nth-last-child(),
 *   :only-child, :empty, :root, :not(), :enabled, :disabled, :checked,
 *   :required, :optional, :first-of-type, :last-of-type
 *
 * Performance optimizations:
 * - Element children are cached per-parent during a query operation
 * - nth-expression parsing is cached
 * - Class matching uses direct string indexOf to avoid classList overhead
 */

import type { Element } from '../nodes/Element';
import type { Node } from '../nodes/Node';
import type {
  SelectorList,
  ComplexSelector,
  CompoundSelector,
  SimpleSelector,
} from './SelectorParser';

// ── Element children cache (cleared per query) ───────────────────────

let _elementChildrenCache: WeakMap<Node, Element[]> | null = null;

function beginQuery(): void {
  _elementChildrenCache = new WeakMap();
}

function endQuery(): void {
  _elementChildrenCache = null;
}

// ── Nth expression cache ──────────────────────────────────────────────

const _nthCache = new Map<string, NthExpression>();

// ── Tag name uppercase cache ──────────────────────────────────────────

const _upperCache = new Map<string, string>();
function _toUpperCase(s: string): string {
  let cached = _upperCache.get(s);
  if (cached === undefined) {
    cached = s.toUpperCase();
    _upperCache.set(s, cached);
  }
  return cached;
}

// ── Public API ────────────────────────────────────────────────────────

/** Returns true if the element matches the selector list. */
export function matchesSelector(element: Element, ast: SelectorList): boolean {
  const selectors = ast.selectors;
  if (selectors.length === 1) return matchesComplex(element, selectors[0]);
  for (let i = 0, len = selectors.length; i < len; i++) {
    if (matchesComplex(element, selectors[i])) return true;
  }
  return false;
}

/** Depth-first pre-order traversal returning all matching elements in the subtree. */
export function querySelectorAllElements(root: Node, ast: SelectorList): Element[] {
  const results: Element[] = [];
  beginQuery();
  try {
    walkDescendants(root, (el) => {
      if (matchesSelector(el, ast)) {
        results.push(el);
      }
    });
  } finally {
    endQuery();
  }
  return results;
}

/** Returns the first matching element in depth-first pre-order, or null. */
export function querySelectorFirstElement(root: Node, ast: SelectorList): Element | null {
  beginQuery();
  try {
    return walkDescendantsFirst(root, (el) => matchesSelector(el, ast));
  } finally {
    endQuery();
  }
}

// ── Complex selector matching ─────────────────────────────────────────

// Pre-computed reversed chain cache
interface ReversedEntry {
  compound: CompoundSelector;
  combinator: string;
}
const _reversedChainCache = new WeakMap<ComplexSelector, ReversedEntry[]>();

function getReversedChain(complex: ComplexSelector): ReversedEntry[] {
  let cached = _reversedChainCache.get(complex);
  if (cached) return cached;

  const entries: ReversedEntry[] = [];
  entries.push({ compound: complex.head, combinator: complex.tail[0].combinator });
  for (let i = 0, len = complex.tail.length - 1; i < len; i++) {
    entries.push({
      compound: complex.tail[i].selector,
      combinator: complex.tail[i + 1].combinator,
    });
  }
  entries.reverse();

  _reversedChainCache.set(complex, entries);
  return entries;
}

function matchesComplex(element: Element, complex: ComplexSelector): boolean {
  // A complex selector is matched right-to-left.
  // The rightmost compound must match the element itself.

  if (complex.tail.length === 0) {
    return matchesCompound(element, complex.head);
  }

  // The element must match the last compound in the chain.
  const lastEntry = complex.tail[complex.tail.length - 1];
  if (!matchesCompound(element, lastEntry.selector)) {
    return false;
  }

  // Walk the pre-computed reversed chain
  const entries = getReversedChain(complex);

  let current: Element = element;
  for (let i = 0, len = entries.length; i < len; i++) {
    const entry = entries[i];
    const comb = entry.combinator;
    if (comb === 'child') {
      const parent = current.parentNode;
      if (!parent || parent.nodeType !== ELEMENT_NODE) return false;
      if (!matchesCompound(parent as Element, entry.compound)) return false;
      current = parent as Element;
    } else if (comb === 'adjacentSibling') {
      const prevSibling = getPreviousElementSibling(current);
      if (!prevSibling) return false;
      if (!matchesCompound(prevSibling, entry.compound)) return false;
      current = prevSibling;
    } else if (comb === 'generalSibling') {
      let sibling = getPreviousElementSibling(current);
      let found = false;
      while (sibling) {
        if (matchesCompound(sibling, entry.compound)) {
          current = sibling;
          found = true;
          break;
        }
        sibling = getPreviousElementSibling(sibling);
      }
      if (!found) return false;
    } else {
      // descendant: walk up ancestors
      let ancestor = current.parentNode;
      let found = false;
      while (ancestor) {
        if (ancestor.nodeType === ELEMENT_NODE && matchesCompound(ancestor as Element, entry.compound)) {
          current = ancestor as Element;
          found = true;
          break;
        }
        ancestor = ancestor.parentNode;
      }
      if (!found) return false;
    }
  }

  return true;
}

// ── Compound selector matching ────────────────────────────────────────

function matchesCompound(element: Element, compound: CompoundSelector): boolean {
  const sels = compound.selectors;
  for (let i = 0, len = sels.length; i < len; i++) {
    if (!matchesSimple(element, sels[i])) return false;
  }
  return true;
}

// ── Simple selector matching ──────────────────────────────────────────

function matchesSimple(element: Element, simple: SimpleSelector): boolean {
  switch (simple.type) {
    case 'universal':
      return true;

    case 'type':
      // tagName is always uppercase; compare with uppercase of selector name
      return element.tagName === _toUpperCase(simple.name);

    case 'id':
      return element.getAttribute('id') === simple.name;

    case 'class':
      // Fast path: check class attribute directly without building a DOMTokenList
      return hasClassName(element, simple.name);

    case 'attribute':
      return matchesAttribute(element, simple);

    case 'pseudo':
      return matchesPseudoClass(element, simple);

    case 'pseudoNot':
      return matchesPseudoNot(element, simple);
  }
}

/** Fast class name check: avoids DOMTokenList overhead by checking the raw class attribute string. */
function hasClassName(element: Element, name: string): boolean {
  const cls = element.getAttribute('class');
  if (!cls) return false;
  // Exact match (most common: single class)
  if (cls === name) return true;
  const len = name.length;
  const clsLen = cls.length;
  // Search for the class name bounded by whitespace or string boundaries
  let idx = 0;
  while (idx <= clsLen - len) {
    const found = cls.indexOf(name, idx);
    if (found === -1) return false;
    const before = found === 0 || cls.charCodeAt(found - 1) <= 32;
    const after = found + len === clsLen || cls.charCodeAt(found + len) <= 32;
    if (before && after) return true;
    idx = found + 1;
  }
  return false;
}

function matchesAttribute(
  element: Element,
  simple: Extract<SimpleSelector, { type: 'attribute' }>,
): boolean {
  const attrValue = element.getAttribute(simple.name);

  // Presence check: [attr]
  if (simple.operator === null) {
    return attrValue !== null;
  }

  // Value checks require the attribute to exist
  if (attrValue === null) return false;
  const value = simple.value!;

  switch (simple.operator) {
    case '=':
      return attrValue === value;
    case '~=':
      return attrValue.split(/\s+/).includes(value);
    case '|=':
      return attrValue === value || attrValue.startsWith(value + '-');
    case '^=':
      return attrValue.startsWith(value);
    case '$=':
      return attrValue.endsWith(value);
    case '*=':
      return attrValue.includes(value);
  }
}

// ── Pseudo-class matching ────────────────────────────────────────────

function matchesPseudoClass(
  element: Element,
  simple: Extract<SimpleSelector, { type: 'pseudo' }>,
): boolean {
  const name = simple.name.toLowerCase();

  switch (name) {
    case 'first-child': {
      const parent = element.parentNode;
      if (!parent) return false;
      return getFirstElementChild(parent) === element;
    }

    case 'last-child': {
      const parent = element.parentNode;
      if (!parent) return false;
      return getLastElementChild(parent) === element;
    }

    case 'only-child': {
      const parent = element.parentNode;
      if (!parent) return false;
      const elementChildren = getElementChildren(parent);
      return elementChildren.length === 1 && elementChildren[0] === element;
    }

    case 'nth-child': {
      if (simple.argument === null) return false;
      const { a, b } = parseNthExpression(simple.argument);
      const position = getElementPosition(element);
      if (position === -1) return false;
      return matchesNth(a, b, position);
    }

    case 'nth-last-child': {
      if (simple.argument === null) return false;
      const { a, b } = parseNthExpression(simple.argument);
      const posFromEnd = getElementPositionFromEnd(element);
      if (posFromEnd === -1) return false;
      return matchesNth(a, b, posFromEnd);
    }

    case 'empty': {
      // Element has no child nodes, or only empty text nodes
      const children = getChildNodes(element);
      for (const child of children) {
        if (child.nodeType === ELEMENT_NODE) return false;
        if (child.nodeType === TEXT_NODE) {
          const text = child.textContent;
          if (text && text.length > 0) return false;
        }
      }
      return true;
    }

    case 'root': {
      // The element is the document element (no parent, or parent is document)
      const parent = element.parentNode;
      if (!parent) return false;
      return parent.nodeType === DOCUMENT_NODE;
    }

    case 'enabled': {
      return isFormElement(element) && !element.hasAttribute('disabled');
    }

    case 'disabled': {
      return isFormElement(element) && element.hasAttribute('disabled');
    }

    case 'checked': {
      const tag = element.tagName.toLowerCase();
      if (tag === 'input') {
        const type = (element.getAttribute('type') || '').toLowerCase();
        if (type === 'checkbox' || type === 'radio') {
          return element.hasAttribute('checked');
        }
      }
      if (tag === 'option') {
        return element.hasAttribute('selected');
      }
      return false;
    }

    case 'required': {
      return isFormInputElement(element) && element.hasAttribute('required');
    }

    case 'optional': {
      return isFormInputElement(element) && !element.hasAttribute('required');
    }

    case 'first-of-type': {
      const parent = element.parentNode;
      if (!parent) return false;
      const tag = element.tagName;
      const children = getElementChildren(parent);
      for (const child of children) {
        if ((child as Element).tagName === tag) {
          return child === element;
        }
      }
      return false;
    }

    case 'last-of-type': {
      const parent = element.parentNode;
      if (!parent) return false;
      const tag = element.tagName;
      const children = getElementChildren(parent);
      for (let i = children.length - 1; i >= 0; i--) {
        if ((children[i] as Element).tagName === tag) {
          return children[i] === element;
        }
      }
      return false;
    }

    default:
      return false;
  }
}

function matchesPseudoNot(
  element: Element,
  simple: Extract<SimpleSelector, { type: 'pseudoNot' }>,
): boolean {
  // :not() — the element must NOT match all inner selectors simultaneously
  return !simple.innerSelectors.every(inner => matchesSimple(element, inner));
}

// ── An+B expression parsing ──────────────────────────────────────────

interface NthExpression {
  a: number;
  b: number;
}

function parseNthExpression(expr: string): NthExpression {
  const s = expr.trim().toLowerCase();

  // Check cache first
  const cached = _nthCache.get(s);
  if (cached) return cached;

  let result: NthExpression;

  if (s === 'odd') {
    result = { a: 2, b: 1 };
  } else if (s === 'even') {
    result = { a: 2, b: 0 };
  } else if (!s.includes('n')) {
    // Pure number (no 'n')
    const num = parseInt(s, 10);
    result = isNaN(num) ? { a: 0, b: 0 } : { a: 0, b: num };
  } else {
    // An+B or An-B or An
    const nIndex = s.indexOf('n');
    let aStr = s.slice(0, nIndex).trim();
    let bStr = s.slice(nIndex + 1).trim();

    // Parse A
    let a: number;
    if (aStr === '' || aStr === '+') {
      a = 1;
    } else if (aStr === '-') {
      a = -1;
    } else {
      a = parseInt(aStr, 10);
      if (isNaN(a)) a = 0;
    }

    // Parse B
    let b: number;
    if (bStr === '') {
      b = 0;
    } else {
      bStr = bStr.replace(/\s+/g, '');
      b = parseInt(bStr, 10);
      if (isNaN(b)) b = 0;
    }

    result = { a, b };
  }

  _nthCache.set(s, result);
  return result;
}

function matchesNth(a: number, b: number, position: number): boolean {
  // Check if position matches An+B for some non-negative integer n
  if (a === 0) {
    return position === b;
  }

  // position = a*n + b  =>  n = (position - b) / a
  const diff = position - b;
  if (diff % a !== 0) return false;
  const n = diff / a;
  return n >= 0;
}

// ── DOM helper functions ─────────────────────────────────────────────

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const DOCUMENT_NODE = 9;

function isElement(node: Node): boolean {
  return node.nodeType === ELEMENT_NODE;
}

function getPreviousElementSibling(element: Element): Element | null {
  let sibling = element.previousSibling;
  while (sibling) {
    if (isElement(sibling)) return sibling as Element;
    sibling = sibling.previousSibling;
  }
  return null;
}

function getElementChildren(parent: Node): Element[] {
  // Use per-query cache to avoid recomputing for the same parent
  if (_elementChildrenCache) {
    const cached = _elementChildrenCache.get(parent);
    if (cached) return cached;
  }
  const raw = (parent as any)._children;
  const children: Element[] = [];
  for (let i = 0, len = raw.length; i < len; i++) {
    if (raw[i].nodeType === ELEMENT_NODE) {
      children.push(raw[i] as Element);
    }
  }
  if (_elementChildrenCache) {
    _elementChildrenCache.set(parent, children);
  }
  return children;
}

function getChildNodes(parent: Node): Node[] {
  return (parent as any)._children;
}

function getFirstElementChild(parent: Node): Element | null {
  const raw = (parent as any)._children;
  for (let i = 0, len = raw.length; i < len; i++) {
    if (raw[i].nodeType === ELEMENT_NODE) return raw[i] as Element;
  }
  return null;
}

function getLastElementChild(parent: Node): Element | null {
  const raw = (parent as any)._children;
  for (let i = raw.length - 1; i >= 0; i--) {
    if (raw[i].nodeType === ELEMENT_NODE) return raw[i] as Element;
  }
  return null;
}

/** Get 1-indexed position of element among its element siblings. */
function getElementPosition(element: Element): number {
  const parent = element.parentNode;
  if (!parent) return -1;
  const elementChildren = getElementChildren(parent);
  const index = elementChildren.indexOf(element);
  return index === -1 ? -1 : index + 1; // 1-indexed
}

/** Get 1-indexed position of element counting from the end. */
function getElementPositionFromEnd(element: Element): number {
  const parent = element.parentNode;
  if (!parent) return -1;
  const elementChildren = getElementChildren(parent);
  const index = elementChildren.indexOf(element);
  if (index === -1) return -1;
  return elementChildren.length - index; // 1-indexed from end
}

function isFormElement(element: Element): boolean {
  const tag = element.tagName.toLowerCase();
  return tag === 'input' || tag === 'select' || tag === 'textarea' || tag === 'button';
}

function isFormInputElement(element: Element): boolean {
  const tag = element.tagName.toLowerCase();
  return tag === 'input' || tag === 'select' || tag === 'textarea';
}

// ── Tree walking helpers ──────────────────────────────────────────────

function walkDescendants(root: Node, callback: (el: Element) => void): void {
  const children = (root as any)._children;
  for (let i = 0, len = children.length; i < len; i++) {
    const child = children[i];
    if (child.nodeType === ELEMENT_NODE) {
      callback(child as Element);
    }
    if (child._children.length > 0) {
      walkDescendants(child, callback);
    }
  }
}

function walkDescendantsFirst(
  root: Node,
  predicate: (el: Element) => boolean,
): Element | null {
  const children = (root as any)._children;
  for (let i = 0, len = children.length; i < len; i++) {
    const child = children[i];
    if (child.nodeType === ELEMENT_NODE) {
      if (predicate(child as Element)) return child as Element;
    }
    if (child._children.length > 0) {
      const found = walkDescendantsFirst(child, predicate);
      if (found) return found;
    }
  }
  return null;
}

// ── Fast-path simple selector detection ───────────────────────────────

// Simple selector regex patterns (no combinators, no pseudo-classes, no commas)
const SIMPLE_CLASS_RE = /^\.[a-zA-Z_\-][a-zA-Z0-9_\-]*$/;
const SIMPLE_ID_RE = /^#[a-zA-Z_\-][a-zA-Z0-9_\-]*$/;
const SIMPLE_TAG_RE = /^[a-zA-Z][a-zA-Z0-9]*$/;

/**
 * Fast querySelector for simple selectors. Returns undefined if not a simple selector.
 * Returns Element|null if handled.
 */
export function _fastQueryFirst(root: Node, selector: string): Element | null | undefined {
  if (selector.length === 0) return undefined;
  const ch = selector.charCodeAt(0);

  // .className
  if (ch === 46 /* '.' */ && SIMPLE_CLASS_RE.test(selector)) {
    const name = selector.slice(1);
    return walkDescendantsFirst(root, (el) => hasClassName(el, name));
  }

  // #id
  if (ch === 35 /* '#' */ && SIMPLE_ID_RE.test(selector)) {
    const name = selector.slice(1);
    return walkDescendantsFirst(root, (el) => el.getAttribute('id') === name);
  }

  // tag
  if (((ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122)) && SIMPLE_TAG_RE.test(selector)) {
    const upper = selector.toUpperCase();
    return walkDescendantsFirst(root, (el) => el.tagName === upper);
  }

  return undefined;
}

/**
 * Fast querySelectorAll for simple selectors. Returns undefined if not a simple selector.
 * Returns Element[] if handled.
 */
export function _fastQueryAll(root: Node, selector: string): Element[] | undefined {
  if (selector.length === 0) return undefined;
  const ch = selector.charCodeAt(0);

  // .className
  if (ch === 46 /* '.' */ && SIMPLE_CLASS_RE.test(selector)) {
    const name = selector.slice(1);
    const results: Element[] = [];
    walkDescendants(root, (el) => {
      if (hasClassName(el, name)) results.push(el);
    });
    return results;
  }

  // #id
  if (ch === 35 /* '#' */ && SIMPLE_ID_RE.test(selector)) {
    const name = selector.slice(1);
    const results: Element[] = [];
    walkDescendants(root, (el) => {
      if (el.getAttribute('id') === name) results.push(el);
    });
    return results;
  }

  // tag
  if (((ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122)) && SIMPLE_TAG_RE.test(selector)) {
    const upper = selector.toUpperCase();
    const results: Element[] = [];
    walkDescendants(root, (el) => {
      if (el.tagName === upper) results.push(el);
    });
    return results;
  }

  return undefined;
}
