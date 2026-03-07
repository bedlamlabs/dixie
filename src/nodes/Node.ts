import { NodeList } from './NodeList';
import { EventTarget } from '../events/EventTarget';
import { triggerMutation, hasMutationObservers } from '../observers/MutationObserver';

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
      const movedNodes = this._consumeFragmentChildren(child);
      if (movedNodes.length === 0) return child;

      const insertion = this._insertNodesAt(this._children.length, movedNodes);
      this._notifyChildListMutation({
        addedNodes: movedNodes,
        previousSibling: insertion.previousSibling,
        nextSibling: insertion.nextSibling,
      });
      return child;
    }

    const insertion = this._insertNodesAt(this._children.length, [child]);
    this._notifyChildListMutation({
      addedNodes: [child],
      previousSibling: insertion.previousSibling,
      nextSibling: insertion.nextSibling,
    });

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

    const { child: removed, previousSibling, nextSibling } = this._spliceChild(index);
    this._notifyChildListMutation({
      removedNodes: [removed],
      previousSibling,
      nextSibling,
    });
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
      const movedNodes = this._consumeFragmentChildren(newChild);
      if (movedNodes.length === 0) return newChild;

      const insertion = this._insertNodesAt(refIndex, movedNodes);
      this._notifyChildListMutation({
        addedNodes: movedNodes,
        previousSibling: insertion.previousSibling,
        nextSibling: insertion.nextSibling,
      });
      return newChild;
    }

    // Re-find refIndex (may have shifted after re-parent removal)
    const insertIndex = this._children.indexOf(refChild);
    const insertion = this._insertNodesAt(insertIndex, [newChild]);
    this._notifyChildListMutation({
      addedNodes: [newChild],
      previousSibling: insertion.previousSibling,
      nextSibling: insertion.nextSibling,
    });

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
      const { previousSibling, nextSibling } = this._spliceChild(replaceIndex);
      const fragmentChildren = this._consumeFragmentChildren(newChild);
      if (fragmentChildren.length > 0) {
        this._insertNodesAt(replaceIndex, fragmentChildren);
      }
      this._notifyChildListMutation({
        addedNodes: fragmentChildren,
        removedNodes: [oldChild],
        previousSibling,
        nextSibling,
      });
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
    this._notifyChildListMutation({
      addedNodes: [newChild],
      removedNodes: [oldChild],
      previousSibling: prev,
      nextSibling: next,
    });

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
      const oldValue = this._textData ?? '';
      this._textData = value;
      this._notifyCharacterDataMutation(oldValue);
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

  protected _notifyChildListMutation(details: {
    addedNodes?: Node[];
    removedNodes?: Node[];
    previousSibling?: Node | null;
    nextSibling?: Node | null;
  }): void {
    this._notifyMutation();
    if (!hasMutationObservers()) return;
    triggerMutation('childList', this, details);
  }

  protected _notifyAttributeMutation(attributeName: string, oldValue: string | null): void {
    this._notifyMutation();
    if (!hasMutationObservers()) return;
    triggerMutation('attributes', this, { attributeName, oldValue });
  }

  protected _notifyCharacterDataMutation(oldValue: string | null): void {
    this._notifyMutation();
    if (!hasMutationObservers()) return;
    triggerMutation('characterData', this, { oldValue });
  }

  /** Remove child at index, fix sibling links, detach from parent. */
  private _spliceChild(index: number): {
    child: Node;
    previousSibling: Node | null;
    nextSibling: Node | null;
  } {
    const child = this._children[index];
    const prev = child.previousSibling;
    const next = child.nextSibling;

    if (prev) prev.nextSibling = next;
    if (next) next.previousSibling = prev;

    child.parentNode = null;
    child.previousSibling = null;
    child.nextSibling = null;

    this._children.splice(index, 1);
    return { child, previousSibling: prev, nextSibling: next };
  }

  private _consumeFragmentChildren(fragment: Node): Node[] {
    if (fragment._children.length === 0) return [];

    const movedNodes = fragment._children.slice();
    fragment._children.length = 0;

    for (const node of movedNodes) {
      node.parentNode = null;
      node.previousSibling = null;
      node.nextSibling = null;
    }

    return movedNodes;
  }

  private _insertNodesAt(index: number, nodes: Node[]): {
    previousSibling: Node | null;
    nextSibling: Node | null;
  } {
    const previousSibling = index > 0 ? this._children[index - 1] : null;
    const nextSibling = index < this._children.length ? this._children[index] : null;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      node.parentNode = this;
      node.previousSibling = i === 0 ? previousSibling : nodes[i - 1];
      node.nextSibling = i === nodes.length - 1 ? nextSibling : nodes[i + 1];
    }

    if (nodes.length > 0) {
      if (previousSibling) previousSibling.nextSibling = nodes[0];
      if (nextSibling) nextSibling.previousSibling = nodes[nodes.length - 1];
      this._children.splice(index, 0, ...nodes);
    }

    return { previousSibling, nextSibling };
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
