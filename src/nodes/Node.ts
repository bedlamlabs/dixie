import { NodeList } from './NodeList';
import { EventTarget } from '../events/EventTarget';

/**
 * Node — the base class of the DOM tree.
 *
 * Every DOM object (Element, Text, Comment, Document, DocumentFragment)
 * inherits from Node. This class owns the parent/child/sibling graph and
 * provides the tree-mutation API (appendChild, removeChild, insertBefore,
 * replaceChild, cloneNode, contains).
 *
 * Node extends EventTarget so all DOM nodes support addEventListener,
 * removeEventListener, and dispatchEvent with full propagation.
 *
 * Design notes:
 * - The internal children array (`_children`) is shared by reference with
 *   the NodeList returned by `childNodes`, making it a live collection.
 * - Sibling links are maintained eagerly on every mutation so traversal
 *   is O(1).
 * - `textContent` concatenates recursively (getter) and replaces all
 *   children with a single text-bearing node (setter). Until the real
 *   Text class arrives, we use a lightweight Node with nodeType TEXT_NODE.
 */
export class Node extends EventTarget {
  // ── Static type constants ────────────────────────────────────────────
  static readonly ELEMENT_NODE = 1;
  static readonly TEXT_NODE = 3;
  static readonly COMMENT_NODE = 8;
  static readonly DOCUMENT_NODE = 9;
  static readonly DOCUMENT_FRAGMENT_NODE = 11;

  // ── Instance state ───────────────────────────────────────────────────
  readonly nodeType: number;
  readonly nodeName: string;

  parentNode: Node | null = null;
  nextSibling: Node | null = null;
  previousSibling: Node | null = null;
  ownerDocument: any | null = null; // typed loosely until Document exists

  /** Mutable text data for TEXT_NODE and COMMENT_NODE. */
  _textData: string | null = null;

  /** Internal children array — shared with the live NodeList. */
  protected _children: Node[] = [];

  /** Cached live NodeList — created lazily on first access. */
  private _childNodes: NodeList<Node> | null = null;

  constructor(nodeType: number, nodeName: string) {
    super();
    this.nodeType = nodeType;
    this.nodeName = nodeName;
    if (nodeType === Node.TEXT_NODE || nodeType === Node.COMMENT_NODE) {
      this._textData = nodeName;
    }
  }

  // ── Child accessors ──────────────────────────────────────────────────

  get childNodes(): NodeList<Node> {
    if (!this._childNodes) {
      this._childNodes = new NodeList<Node>(this._children, true);
    }
    return this._childNodes;
  }

  get firstChild(): Node | null {
    return this._children[0] ?? null;
  }

  get lastChild(): Node | null {
    return this._children[this._children.length - 1] ?? null;
  }

  // ── Query helpers ────────────────────────────────────────────────────

  hasChildNodes(): boolean {
    return this._children.length > 0;
  }

  contains(other: Node | null): boolean {
    if (other === null) return false;
    if (other === this) return true;
    for (const child of this._children) {
      if (child.contains(other)) return true;
    }
    return false;
  }

  // ── Tree mutations ───────────────────────────────────────────────────

  appendChild(child: Node): Node {
    if (child === this || child.contains(this)) {
      throw new DOMException(
        "Failed to execute 'appendChild' on 'Node': The new child element contains the parent.",
        'HierarchyRequestError',
      );
    }

    // Re-parent: remove from old parent first
    if (child.parentNode) {
      child.parentNode.removeChild(child);
    }

    // If appending a DocumentFragment, move its children instead
    if (child.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      while (child._children.length > 0) {
        this.appendChild(child._children[0]);
      }
      return child;
    }

    // Wire up
    const last = this.lastChild;
    if (last) {
      last.nextSibling = child;
      child.previousSibling = last;
    } else {
      child.previousSibling = null;
    }
    child.nextSibling = null;
    child.parentNode = this;
    this._children.push(child);
    this._notifyMutation();

    return child;
  }

  removeChild(child: Node): Node {
    const index = this._children.indexOf(child);
    if (index === -1) {
      throw new DOMException(
        "Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.",
        'NotFoundError',
      );
    }

    this._spliceChild(index);
    return child;
  }

  insertBefore(newChild: Node, refChild: Node | null): Node {
    // null refChild → append
    if (refChild === null) {
      return this.appendChild(newChild);
    }

    // Same node — no-op per spec
    if (newChild === refChild) {
      return newChild;
    }

    const refIndex = this._children.indexOf(refChild);
    if (refIndex === -1) {
      throw new DOMException(
        "Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.",
        'NotFoundError',
      );
    }

    if (newChild === this || newChild.contains(this)) {
      throw new DOMException(
        "Failed to execute 'insertBefore' on 'Node': The new child element contains the parent.",
        'HierarchyRequestError',
      );
    }

    // Re-parent
    if (newChild.parentNode) {
      newChild.parentNode.removeChild(newChild);
    }

    // If inserting a DocumentFragment, move its children instead
    if (newChild.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      // Insert fragment children in order before refChild
      while (newChild._children.length > 0) {
        this.insertBefore(newChild._children[0], refChild);
      }
      return newChild;
    }

    // Re-find refIndex (may have shifted after re-parent removal)
    const insertIndex = this._children.indexOf(refChild);

    // Wire sibling links
    const prev = refChild.previousSibling;
    if (prev) {
      prev.nextSibling = newChild;
    }
    newChild.previousSibling = prev;
    newChild.nextSibling = refChild;
    refChild.previousSibling = newChild;

    newChild.parentNode = this;
    this._children.splice(insertIndex, 0, newChild);
    this._notifyMutation();

    return newChild;
  }

  replaceChild(newChild: Node, oldChild: Node): Node {
    // Same node — no-op per spec
    if (newChild === oldChild) {
      return oldChild;
    }

    const index = this._children.indexOf(oldChild);
    if (index === -1) {
      throw new DOMException(
        "Failed to execute 'replaceChild' on 'Node': The node to be replaced is not a child of this node.",
        'NotFoundError',
      );
    }

    if (newChild === this || newChild.contains(this)) {
      throw new DOMException(
        "Failed to execute 'replaceChild' on 'Node': The new child element contains the parent.",
        'HierarchyRequestError',
      );
    }

    // Re-parent newChild
    if (newChild.parentNode) {
      newChild.parentNode.removeChild(newChild);
    }

    // Re-find index (may have shifted if newChild was a sibling)
    const replaceIndex = this._children.indexOf(oldChild);

    // If replacing with a DocumentFragment, splice its children in
    if (newChild.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      const fragmentChildren = [...newChild._children];
      // Remove oldChild
      this._spliceChild(replaceIndex);
      // Insert fragment children at the position
      for (let i = 0; i < fragmentChildren.length; i++) {
        const fc = fragmentChildren[i];
        fc.parentNode = null; // detach from fragment
        // Find insertion point
        if (replaceIndex + i >= this._children.length) {
          this.appendChild(fc);
        } else {
          this.insertBefore(fc, this._children[replaceIndex + i]);
        }
      }
      newChild._children.length = 0;
      return oldChild;
    }

    // Wire sibling links
    const prev = oldChild.previousSibling;
    const next = oldChild.nextSibling;

    newChild.previousSibling = prev;
    newChild.nextSibling = next;
    if (prev) prev.nextSibling = newChild;
    if (next) next.previousSibling = newChild;

    // Disconnect oldChild
    oldChild.parentNode = null;
    oldChild.previousSibling = null;
    oldChild.nextSibling = null;

    // Slot newChild in
    newChild.parentNode = this;
    this._children[replaceIndex] = newChild;
    this._notifyMutation();

    return oldChild;
  }

  // ── Clone ────────────────────────────────────────────────────────────

  cloneNode(deep?: boolean): Node {
    const clone = new (this.constructor as typeof Node)(this.nodeType, this.nodeName);
    clone.ownerDocument = this.ownerDocument;
    clone._textData = this._textData;
    if (deep) {
      for (const child of this._children) {
        clone.appendChild(child.cloneNode(true));
      }
    }
    return clone;
  }

  // ── textContent ──────────────────────────────────────────────────────

  get textContent(): string {
    // For text-bearing nodes, return mutable text data
    if (this.nodeType === Node.TEXT_NODE || this.nodeType === Node.COMMENT_NODE) {
      return this._textData ?? '';
    }
    let text = '';
    for (const child of this._children) {
      text += child.textContent;
    }
    return text;
  }

  set textContent(value: string) {
    // Normalize null/undefined to empty string per spec
    if (value == null) value = '';

    // For text-bearing nodes, update the data directly (no children)
    if (this.nodeType === Node.TEXT_NODE || this.nodeType === Node.COMMENT_NODE) {
      this._textData = value;
      return;
    }

    // Remove all children
    while (this._children.length > 0) {
      this._spliceChild(0);
    }
    // Add a text-bearing node if value is non-empty
    if (value !== '') {
      const textNode = new Node(Node.TEXT_NODE, value);
      this.appendChild(textNode);
    }
  }

  // ── Internal helpers ─────────────────────────────────────────────────

  /** Notify owning document of a tree/attribute mutation (for query cache invalidation). */
  protected _notifyMutation(): void {
    const doc = this.nodeType === 9 /* DOCUMENT_NODE */ ? this as any : this.ownerDocument;
    if (doc) doc._mutationVersion++;
  }

  /** Remove child at index, fix sibling links, detach from parent. */
  private _spliceChild(index: number): void {
    const child = this._children[index];
    const prev = child.previousSibling;
    const next = child.nextSibling;

    if (prev) prev.nextSibling = next;
    if (next) next.previousSibling = prev;

    child.parentNode = null;
    child.previousSibling = null;
    child.nextSibling = null;

    this._children.splice(index, 1);
    this._notifyMutation();
  }
}

// Per the DOM spec, node type constants must be accessible on instances too
Object.defineProperties(Node.prototype, {
  ELEMENT_NODE: { value: 1 },
  TEXT_NODE: { value: 3 },
  COMMENT_NODE: { value: 8 },
  DOCUMENT_NODE: { value: 9 },
  DOCUMENT_FRAGMENT_NODE: { value: 11 },
});
