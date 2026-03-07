import { describe, it, expect } from 'vitest';
import { Node, NodeList } from '../src/index';

/** Helper: create a node with a readable name for debugging */
function n(name: string, type: number = Node.ELEMENT_NODE): Node {
  return new Node(type, name);
}

// ════════════════════════════════════════════════════════════════════════
// Static constants
// ════════════════════════════════════════════════════════════════════════

describe('Node static constants', () => {
  it('ELEMENT_NODE === 1', () => expect(Node.ELEMENT_NODE).toBe(1));
  it('TEXT_NODE === 3', () => expect(Node.TEXT_NODE).toBe(3));
  it('COMMENT_NODE === 8', () => expect(Node.COMMENT_NODE).toBe(8));
  it('DOCUMENT_NODE === 9', () => expect(Node.DOCUMENT_NODE).toBe(9));
  it('DOCUMENT_FRAGMENT_NODE === 11', () => expect(Node.DOCUMENT_FRAGMENT_NODE).toBe(11));
});

// ════════════════════════════════════════════════════════════════════════
// Construction & read-only properties
// ════════════════════════════════════════════════════════════════════════

describe('Node construction', () => {
  it('stores nodeType and nodeName', () => {
    const node = new Node(1, 'DIV');
    expect(node.nodeType).toBe(1);
    expect(node.nodeName).toBe('DIV');
  });

  it('starts with no parent or siblings', () => {
    const node = n('A');
    expect(node.parentNode).toBeNull();
    expect(node.nextSibling).toBeNull();
    expect(node.previousSibling).toBeNull();
  });

  it('starts with no children', () => {
    const node = n('A');
    expect(node.firstChild).toBeNull();
    expect(node.lastChild).toBeNull();
    expect(node.hasChildNodes()).toBe(false);
    expect(node.childNodes.length).toBe(0);
  });

  it('ownerDocument is null by default', () => {
    expect(n('A').ownerDocument).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════════════
// appendChild
// ════════════════════════════════════════════════════════════════════════

describe('appendChild', () => {
  it('adds a child and returns it', () => {
    const parent = n('parent');
    const child = n('child');
    const result = parent.appendChild(child);
    expect(result).toBe(child);
    expect(parent.childNodes.length).toBe(1);
    expect(parent.firstChild).toBe(child);
    expect(parent.lastChild).toBe(child);
  });

  it('sets parentNode on the child', () => {
    const parent = n('parent');
    const child = n('child');
    parent.appendChild(child);
    expect(child.parentNode).toBe(parent);
  });

  it('maintains sibling links with multiple children', () => {
    const parent = n('parent');
    const a = n('A');
    const b = n('B');
    const c = n('C');
    parent.appendChild(a);
    parent.appendChild(b);
    parent.appendChild(c);

    expect(parent.firstChild).toBe(a);
    expect(parent.lastChild).toBe(c);

    expect(a.previousSibling).toBeNull();
    expect(a.nextSibling).toBe(b);
    expect(b.previousSibling).toBe(a);
    expect(b.nextSibling).toBe(c);
    expect(c.previousSibling).toBe(b);
    expect(c.nextSibling).toBeNull();
  });

  it('re-parents a child from a different parent', () => {
    const parent1 = n('P1');
    const parent2 = n('P2');
    const child = n('child');

    parent1.appendChild(child);
    expect(parent1.childNodes.length).toBe(1);

    parent2.appendChild(child);
    expect(parent1.childNodes.length).toBe(0);
    expect(parent2.childNodes.length).toBe(1);
    expect(child.parentNode).toBe(parent2);
  });

  it('moves child to end when re-appending to same parent', () => {
    const parent = n('parent');
    const a = n('A');
    const b = n('B');
    parent.appendChild(a);
    parent.appendChild(b);

    parent.appendChild(a); // move A after B
    expect(parent.firstChild).toBe(b);
    expect(parent.lastChild).toBe(a);
    expect(b.nextSibling).toBe(a);
    expect(a.previousSibling).toBe(b);
    expect(b.previousSibling).toBeNull();
    expect(a.nextSibling).toBeNull();
  });

  it('throws when trying to append a node to itself', () => {
    const node = n('self');
    expect(() => node.appendChild(node)).toThrow();
  });
});

// ════════════════════════════════════════════════════════════════════════
// removeChild
// ════════════════════════════════════════════════════════════════════════

describe('removeChild', () => {
  it('removes and returns the child', () => {
    const parent = n('parent');
    const child = n('child');
    parent.appendChild(child);
    const result = parent.removeChild(child);
    expect(result).toBe(child);
    expect(parent.childNodes.length).toBe(0);
    expect(child.parentNode).toBeNull();
  });

  it('clears sibling links on removed node', () => {
    const parent = n('parent');
    const a = n('A');
    const b = n('B');
    const c = n('C');
    parent.appendChild(a);
    parent.appendChild(b);
    parent.appendChild(c);

    parent.removeChild(b);
    expect(b.previousSibling).toBeNull();
    expect(b.nextSibling).toBeNull();
    expect(a.nextSibling).toBe(c);
    expect(c.previousSibling).toBe(a);
  });

  it('handles removing first child', () => {
    const parent = n('parent');
    const a = n('A');
    const b = n('B');
    parent.appendChild(a);
    parent.appendChild(b);

    parent.removeChild(a);
    expect(parent.firstChild).toBe(b);
    expect(b.previousSibling).toBeNull();
  });

  it('handles removing last child', () => {
    const parent = n('parent');
    const a = n('A');
    const b = n('B');
    parent.appendChild(a);
    parent.appendChild(b);

    parent.removeChild(b);
    expect(parent.lastChild).toBe(a);
    expect(a.nextSibling).toBeNull();
  });

  it('handles removing only child', () => {
    const parent = n('parent');
    const child = n('child');
    parent.appendChild(child);
    parent.removeChild(child);
    expect(parent.firstChild).toBeNull();
    expect(parent.lastChild).toBeNull();
    expect(parent.hasChildNodes()).toBe(false);
  });

  it('throws when child is not a child of this node', () => {
    const parent = n('parent');
    const stranger = n('stranger');
    expect(() => parent.removeChild(stranger)).toThrow('not a child');
  });
});

// ════════════════════════════════════════════════════════════════════════
// insertBefore
// ════════════════════════════════════════════════════════════════════════

describe('insertBefore', () => {
  it('inserts before a reference child', () => {
    const parent = n('parent');
    const a = n('A');
    const b = n('B');
    const c = n('C');
    parent.appendChild(a);
    parent.appendChild(c);

    parent.insertBefore(b, c);
    expect(parent.childNodes.length).toBe(3);
    expect(parent.childNodes[0]).toBe(a);
    expect(parent.childNodes[1]).toBe(b);
    expect(parent.childNodes[2]).toBe(c);
  });

  it('updates sibling links correctly', () => {
    const parent = n('parent');
    const a = n('A');
    const b = n('B');
    const c = n('C');
    parent.appendChild(a);
    parent.appendChild(c);
    parent.insertBefore(b, c);

    expect(a.nextSibling).toBe(b);
    expect(b.previousSibling).toBe(a);
    expect(b.nextSibling).toBe(c);
    expect(c.previousSibling).toBe(b);
  });

  it('inserts at the beginning when refChild is firstChild', () => {
    const parent = n('parent');
    const a = n('A');
    const b = n('B');
    parent.appendChild(b);
    parent.insertBefore(a, b);

    expect(parent.firstChild).toBe(a);
    expect(a.previousSibling).toBeNull();
    expect(a.nextSibling).toBe(b);
    expect(b.previousSibling).toBe(a);
  });

  it('appends when refChild is null', () => {
    const parent = n('parent');
    const a = n('A');
    const b = n('B');
    parent.appendChild(a);
    parent.insertBefore(b, null);

    expect(parent.lastChild).toBe(b);
    expect(a.nextSibling).toBe(b);
  });

  it('re-parents when newChild has an existing parent', () => {
    const oldParent = n('old');
    const newParent = n('new');
    const ref = n('ref');
    const child = n('child');

    oldParent.appendChild(child);
    newParent.appendChild(ref);

    newParent.insertBefore(child, ref);
    expect(oldParent.childNodes.length).toBe(0);
    expect(child.parentNode).toBe(newParent);
  });

  it('throws when refChild is not a child of this node', () => {
    const parent = n('parent');
    const newChild = n('new');
    const stranger = n('stranger');
    expect(() => parent.insertBefore(newChild, stranger)).toThrow('not a child');
  });

  it('moves existing child before another sibling in same parent', () => {
    const parent = n('parent');
    const a = n('A');
    const b = n('B');
    const c = n('C');
    parent.appendChild(a);
    parent.appendChild(b);
    parent.appendChild(c);

    // Move C before A
    parent.insertBefore(c, a);
    expect(parent.childNodes[0]).toBe(c);
    expect(parent.childNodes[1]).toBe(a);
    expect(parent.childNodes[2]).toBe(b);
    expect(c.previousSibling).toBeNull();
    expect(c.nextSibling).toBe(a);
    expect(a.previousSibling).toBe(c);
    expect(a.nextSibling).toBe(b);
    expect(b.previousSibling).toBe(a);
    expect(b.nextSibling).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════════════
// replaceChild
// ════════════════════════════════════════════════════════════════════════

describe('replaceChild', () => {
  it('replaces old child with new child and returns old', () => {
    const parent = n('parent');
    const a = n('A');
    const b = n('B');
    parent.appendChild(a);

    const result = parent.replaceChild(b, a);
    expect(result).toBe(a);
    expect(parent.childNodes.length).toBe(1);
    expect(parent.firstChild).toBe(b);
    expect(a.parentNode).toBeNull();
    expect(b.parentNode).toBe(parent);
  });

  it('preserves sibling links after replacement', () => {
    const parent = n('parent');
    const a = n('A');
    const b = n('B');
    const c = n('C');
    const replacement = n('X');
    parent.appendChild(a);
    parent.appendChild(b);
    parent.appendChild(c);

    parent.replaceChild(replacement, b);

    expect(a.nextSibling).toBe(replacement);
    expect(replacement.previousSibling).toBe(a);
    expect(replacement.nextSibling).toBe(c);
    expect(c.previousSibling).toBe(replacement);
  });

  it('re-parents newChild from another parent', () => {
    const p1 = n('P1');
    const p2 = n('P2');
    const old = n('old');
    const moved = n('moved');

    p1.appendChild(moved);
    p2.appendChild(old);

    p2.replaceChild(moved, old);
    expect(p1.childNodes.length).toBe(0);
    expect(p2.firstChild).toBe(moved);
  });

  it('replaces first child correctly', () => {
    const parent = n('parent');
    const a = n('A');
    const b = n('B');
    const x = n('X');
    parent.appendChild(a);
    parent.appendChild(b);

    parent.replaceChild(x, a);
    expect(parent.firstChild).toBe(x);
    expect(x.previousSibling).toBeNull();
    expect(x.nextSibling).toBe(b);
  });

  it('replaces last child correctly', () => {
    const parent = n('parent');
    const a = n('A');
    const b = n('B');
    const x = n('X');
    parent.appendChild(a);
    parent.appendChild(b);

    parent.replaceChild(x, b);
    expect(parent.lastChild).toBe(x);
    expect(x.nextSibling).toBeNull();
    expect(a.nextSibling).toBe(x);
  });

  it('throws when oldChild is not a child', () => {
    const parent = n('parent');
    const newChild = n('new');
    const stranger = n('stranger');
    expect(() => parent.replaceChild(newChild, stranger)).toThrow('not a child');
  });

  it('handles replacing sibling with another sibling (same parent)', () => {
    const parent = n('parent');
    const a = n('A');
    const b = n('B');
    const c = n('C');
    parent.appendChild(a);
    parent.appendChild(b);
    parent.appendChild(c);

    // Replace B with A (A is already a sibling)
    parent.replaceChild(a, b);
    // Now parent should have: A, C
    expect(parent.childNodes.length).toBe(2);
    expect(parent.childNodes[0]).toBe(a);
    expect(parent.childNodes[1]).toBe(c);
    expect(a.nextSibling).toBe(c);
    expect(c.previousSibling).toBe(a);
  });
});

// ════════════════════════════════════════════════════════════════════════
// cloneNode
// ════════════════════════════════════════════════════════════════════════

describe('cloneNode', () => {
  it('shallow clone copies nodeType and nodeName', () => {
    const original = new Node(1, 'DIV');
    const clone = original.cloneNode();
    expect(clone.nodeType).toBe(1);
    expect(clone.nodeName).toBe('DIV');
    expect(clone).not.toBe(original);
  });

  it('shallow clone does not copy children', () => {
    const parent = n('parent');
    parent.appendChild(n('child'));
    const clone = parent.cloneNode(false);
    expect(clone.childNodes.length).toBe(0);
  });

  it('deep clone recursively copies children', () => {
    const root = n('root');
    const a = n('A');
    const b = n('B');
    a.appendChild(b);
    root.appendChild(a);

    const clone = root.cloneNode(true);
    expect(clone.childNodes.length).toBe(1);
    expect(clone.firstChild!.nodeName).toBe('A');
    expect(clone.firstChild!.firstChild!.nodeName).toBe('B');
    // Clones are distinct objects
    expect(clone.firstChild).not.toBe(a);
    expect(clone.firstChild!.firstChild).not.toBe(b);
  });

  it('cloned node has no parent', () => {
    const parent = n('parent');
    const child = n('child');
    parent.appendChild(child);
    const clone = child.cloneNode();
    expect(clone.parentNode).toBeNull();
  });

  it('deep clone preserves correct parent/sibling links', () => {
    const root = n('root');
    const a = n('A');
    const b = n('B');
    root.appendChild(a);
    root.appendChild(b);

    const clone = root.cloneNode(true);
    expect(clone.firstChild!.parentNode).toBe(clone);
    expect(clone.firstChild!.nextSibling).toBe(clone.lastChild);
    expect(clone.lastChild!.previousSibling).toBe(clone.firstChild);
  });
});

// ════════════════════════════════════════════════════════════════════════
// contains
// ════════════════════════════════════════════════════════════════════════

describe('contains', () => {
  it('returns true for itself', () => {
    const node = n('A');
    expect(node.contains(node)).toBe(true);
  });

  it('returns true for a direct child', () => {
    const parent = n('parent');
    const child = n('child');
    parent.appendChild(child);
    expect(parent.contains(child)).toBe(true);
  });

  it('returns true for a deep descendant', () => {
    const root = n('root');
    const mid = n('mid');
    const leaf = n('leaf');
    root.appendChild(mid);
    mid.appendChild(leaf);
    expect(root.contains(leaf)).toBe(true);
  });

  it('returns false for a non-descendant', () => {
    const a = n('A');
    const b = n('B');
    expect(a.contains(b)).toBe(false);
  });

  it('returns false for null', () => {
    const a = n('A');
    expect(a.contains(null)).toBe(false);
  });

  it('child does not contain parent', () => {
    const parent = n('parent');
    const child = n('child');
    parent.appendChild(child);
    expect(child.contains(parent)).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════
// textContent
// ════════════════════════════════════════════════════════════════════════

describe('textContent', () => {
  it('returns empty string for node with no children', () => {
    const node = n('DIV');
    expect(node.textContent).toBe('');
  });

  it('returns nodeName for a TEXT_NODE', () => {
    const text = new Node(Node.TEXT_NODE, 'hello');
    expect(text.textContent).toBe('hello');
  });

  it('concatenates text of all descendants', () => {
    const parent = n('parent');
    parent.appendChild(new Node(Node.TEXT_NODE, 'hello'));
    parent.appendChild(new Node(Node.TEXT_NODE, ' world'));
    expect(parent.textContent).toBe('hello world');
  });

  it('works recursively through nested nodes', () => {
    const root = n('root');
    const child = n('child');
    child.appendChild(new Node(Node.TEXT_NODE, 'deep'));
    root.appendChild(new Node(Node.TEXT_NODE, 'shallow'));
    root.appendChild(child);
    expect(root.textContent).toBe('shallowdeep');
  });

  it('setter replaces all children with a text node', () => {
    const parent = n('parent');
    parent.appendChild(n('A'));
    parent.appendChild(n('B'));

    parent.textContent = 'new text';
    expect(parent.childNodes.length).toBe(1);
    expect(parent.firstChild!.nodeType).toBe(Node.TEXT_NODE);
    expect(parent.textContent).toBe('new text');
  });

  it('setter with empty string removes all children', () => {
    const parent = n('parent');
    parent.appendChild(n('A'));

    parent.textContent = '';
    expect(parent.childNodes.length).toBe(0);
  });

  it('setter clears old children parent links', () => {
    const parent = n('parent');
    const child = n('child');
    parent.appendChild(child);

    parent.textContent = 'replaced';
    expect(child.parentNode).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════════════
// hasChildNodes
// ════════════════════════════════════════════════════════════════════════

describe('hasChildNodes', () => {
  it('returns false for empty node', () => {
    expect(n('A').hasChildNodes()).toBe(false);
  });

  it('returns true after adding a child', () => {
    const parent = n('parent');
    parent.appendChild(n('child'));
    expect(parent.hasChildNodes()).toBe(true);
  });

  it('returns false after removing all children', () => {
    const parent = n('parent');
    const child = n('child');
    parent.appendChild(child);
    parent.removeChild(child);
    expect(parent.hasChildNodes()).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════
// NodeList
// ════════════════════════════════════════════════════════════════════════

describe('NodeList', () => {
  it('is live — reflects mutations immediately', () => {
    const parent = n('parent');
    const list = parent.childNodes;
    expect(list.length).toBe(0);

    parent.appendChild(n('A'));
    expect(list.length).toBe(1);

    parent.appendChild(n('B'));
    expect(list.length).toBe(2);

    parent.removeChild(parent.firstChild!);
    expect(list.length).toBe(1);
  });

  it('returns the same NodeList instance on repeated access', () => {
    const parent = n('parent');
    expect(parent.childNodes).toBe(parent.childNodes);
  });

  it('item() returns node at index or null', () => {
    const parent = n('parent');
    const a = n('A');
    parent.appendChild(a);

    expect(parent.childNodes.item(0)).toBe(a);
    expect(parent.childNodes.item(1)).toBeNull();
    expect(parent.childNodes.item(-1)).toBeNull();
  });

  it('supports indexed access via bracket notation', () => {
    const parent = n('parent');
    const a = n('A');
    const b = n('B');
    parent.appendChild(a);
    parent.appendChild(b);

    expect(parent.childNodes[0]).toBe(a);
    expect(parent.childNodes[1]).toBe(b);
    expect(parent.childNodes[2]).toBeUndefined();
  });

  it('forEach iterates over items', () => {
    const parent = n('parent');
    parent.appendChild(n('A'));
    parent.appendChild(n('B'));
    parent.appendChild(n('C'));

    const names: string[] = [];
    parent.childNodes.forEach((node) => names.push(node.nodeName));
    expect(names).toEqual(['A', 'B', 'C']);
  });

  it('is iterable with for...of', () => {
    const parent = n('parent');
    parent.appendChild(n('A'));
    parent.appendChild(n('B'));

    const names: string[] = [];
    for (const child of parent.childNodes) {
      names.push(child.nodeName);
    }
    expect(names).toEqual(['A', 'B']);
  });

  it('entries() yields [index, node] pairs', () => {
    const parent = n('parent');
    const a = n('A');
    parent.appendChild(a);

    const entries = [...parent.childNodes.entries()];
    expect(entries).toEqual([[0, a]]);
  });

  it('keys() yields indices', () => {
    const parent = n('parent');
    parent.appendChild(n('A'));
    parent.appendChild(n('B'));

    expect([...parent.childNodes.keys()]).toEqual([0, 1]);
  });

  it('values() yields nodes', () => {
    const parent = n('parent');
    const a = n('A');
    const b = n('B');
    parent.appendChild(a);
    parent.appendChild(b);

    expect([...parent.childNodes.values()]).toEqual([a, b]);
  });
});

// ════════════════════════════════════════════════════════════════════════
// Sibling link integrity — stress tests
// ════════════════════════════════════════════════════════════════════════

describe('sibling link integrity', () => {
  /** Walk the sibling chain forward and return names */
  function forwardChain(node: Node): string[] {
    const names: string[] = [];
    let current: Node | null = node;
    while (current) {
      names.push(current.nodeName);
      current = current.nextSibling;
    }
    return names;
  }

  /** Walk the sibling chain backward and return names */
  function backwardChain(node: Node): string[] {
    const names: string[] = [];
    let current: Node | null = node;
    while (current) {
      names.push(current.nodeName);
      current = current.previousSibling;
    }
    return names;
  }

  it('forward and backward chains agree after appends', () => {
    const parent = n('parent');
    parent.appendChild(n('A'));
    parent.appendChild(n('B'));
    parent.appendChild(n('C'));
    parent.appendChild(n('D'));

    expect(forwardChain(parent.firstChild!)).toEqual(['A', 'B', 'C', 'D']);
    expect(backwardChain(parent.lastChild!)).toEqual(['D', 'C', 'B', 'A']);
  });

  it('chains stay consistent after middle removal', () => {
    const parent = n('parent');
    const a = n('A');
    const b = n('B');
    const c = n('C');
    const d = n('D');
    parent.appendChild(a);
    parent.appendChild(b);
    parent.appendChild(c);
    parent.appendChild(d);

    parent.removeChild(b);
    parent.removeChild(c);

    expect(forwardChain(parent.firstChild!)).toEqual(['A', 'D']);
    expect(backwardChain(parent.lastChild!)).toEqual(['D', 'A']);
  });

  it('chains stay consistent after insertBefore at various positions', () => {
    const parent = n('parent');
    const a = n('A');
    const d = n('D');
    parent.appendChild(a);
    parent.appendChild(d);

    parent.insertBefore(n('C'), d);
    parent.insertBefore(n('B'), parent.childNodes[1]!); // before C

    expect(forwardChain(parent.firstChild!)).toEqual(['A', 'B', 'C', 'D']);
    expect(backwardChain(parent.lastChild!)).toEqual(['D', 'C', 'B', 'A']);
  });

  it('chains stay consistent after replaceChild', () => {
    const parent = n('parent');
    const a = n('A');
    const b = n('B');
    const c = n('C');
    parent.appendChild(a);
    parent.appendChild(b);
    parent.appendChild(c);

    parent.replaceChild(n('X'), b);

    expect(forwardChain(parent.firstChild!)).toEqual(['A', 'X', 'C']);
    expect(backwardChain(parent.lastChild!)).toEqual(['C', 'X', 'A']);
  });
});

// ════════════════════════════════════════════════════════════════════════
// Edge cases
// ════════════════════════════════════════════════════════════════════════

describe('edge cases', () => {
  it('appending same node twice to same parent just moves it', () => {
    const parent = n('parent');
    const child = n('child');
    parent.appendChild(child);
    parent.appendChild(child);
    expect(parent.childNodes.length).toBe(1);
  });

  it('deep tree textContent works 3 levels deep', () => {
    const root = n('root');
    const l1 = n('l1');
    const l2 = n('l2');
    l2.appendChild(new Node(Node.TEXT_NODE, 'deep'));
    l1.appendChild(l2);
    root.appendChild(l1);
    root.appendChild(new Node(Node.TEXT_NODE, 'shallow'));
    expect(root.textContent).toBe('deepshallow');
  });

  it('cloneNode deep on a complex tree', () => {
    const root = n('root');
    const a = n('A');
    const b = n('B');
    const c = n('C');
    a.appendChild(b);
    b.appendChild(c);
    root.appendChild(a);

    const clone = root.cloneNode(true);
    expect(clone.firstChild!.firstChild!.firstChild!.nodeName).toBe('C');
    // Mutation on clone does not affect original
    clone.firstChild!.removeChild(clone.firstChild!.firstChild!);
    expect(a.firstChild).toBe(b); // original unaffected
  });

  it('removing a node that was already removed throws', () => {
    const parent = n('parent');
    const child = n('child');
    parent.appendChild(child);
    parent.removeChild(child);
    expect(() => parent.removeChild(child)).toThrow();
  });

  it('insertBefore with newChild === refChild is a no-op', () => {
    const parent = n('parent');
    const a = n('A');
    const b = n('B');
    parent.appendChild(a);
    parent.appendChild(b);

    parent.insertBefore(a, a);
    // Tree unchanged
    expect(parent.childNodes.length).toBe(2);
    expect(parent.childNodes[0]).toBe(a);
    expect(parent.childNodes[1]).toBe(b);
    expect(a.nextSibling).toBe(b);
    expect(a.previousSibling).toBeNull();
    expect(a.nextSibling).not.toBe(a);
    expect(a.previousSibling).not.toBe(a);
  });

  it('replaceChild with newChild === oldChild is a no-op', () => {
    const parent = n('parent');
    const a = n('A');
    const b = n('B');
    parent.appendChild(a);
    parent.appendChild(b);

    const result = parent.replaceChild(a, a);
    expect(result).toBe(a);
    expect(parent.childNodes.length).toBe(2);
    expect(parent.contains(a)).toBe(true);
    expect(a.parentNode).toBe(parent);
    expect(parent.childNodes[0]).toBe(a);
    expect(parent.childNodes[1]).toBe(b);
  });
});

// ════════════════════════════════════════════════════════════════════════
// QA defect regression tests (D1-D9)
// ════════════════════════════════════════════════════════════════════════

describe('D1-D3: ancestor cycle detection', () => {
  it('appendChild throws when child is a grandparent (2-level cycle)', () => {
    const a = n('A');
    const b = n('B');
    a.appendChild(b);
    expect(() => b.appendChild(a)).toThrow('contains the parent');
  });

  it('appendChild throws when child is a great-grandparent (3-level cycle)', () => {
    const a = n('A');
    const b = n('B');
    const c = n('C');
    a.appendChild(b);
    b.appendChild(c);
    expect(() => c.appendChild(a)).toThrow('contains the parent');
  });

  it('insertBefore throws when newChild is an ancestor', () => {
    const a = n('A');
    const b = n('B');
    const c = n('C');
    a.appendChild(b);
    b.appendChild(c);
    expect(() => c.insertBefore(a, c.firstChild)).toThrow('contains the parent');
    // Also test with null refChild (append path)
    expect(() => c.insertBefore(a, null)).toThrow('contains the parent');
  });

  it('replaceChild throws when newChild is an ancestor', () => {
    const a = n('A');
    const b = n('B');
    const c = n('C');
    const d = n('D');
    a.appendChild(b);
    b.appendChild(c);
    c.appendChild(d);
    expect(() => c.replaceChild(a, d)).toThrow('contains the parent');
  });

  it('tree remains intact after rejected ancestor-cycle attempt', () => {
    const a = n('A');
    const b = n('B');
    const c = n('C');
    a.appendChild(b);
    b.appendChild(c);

    expect(() => c.appendChild(a)).toThrow();

    // Original tree unchanged
    expect(a.parentNode).toBeNull();
    expect(b.parentNode).toBe(a);
    expect(c.parentNode).toBe(b);
    expect(a.contains(c)).toBe(true);
    expect(c.contains(a)).toBe(false);
  });
});

describe('D6: cloneNode copies ownerDocument', () => {
  it('shallow clone preserves ownerDocument', () => {
    const node = n('DIV');
    const mockDoc = { nodeType: 9 };
    node.ownerDocument = mockDoc;
    const clone = node.cloneNode(false);
    expect(clone.ownerDocument).toBe(mockDoc);
  });

  it('deep clone preserves ownerDocument on cloned children', () => {
    const root = n('root');
    const child = n('child');
    const mockDoc = { nodeType: 9 };
    root.ownerDocument = mockDoc;
    child.ownerDocument = mockDoc;
    root.appendChild(child);

    const clone = root.cloneNode(true);
    expect(clone.ownerDocument).toBe(mockDoc);
    expect(clone.firstChild!.ownerDocument).toBe(mockDoc);
  });
});

describe('D7: textContent setter with null', () => {
  it('setting textContent to null clears children', () => {
    const parent = n('parent');
    parent.appendChild(n('A'));
    parent.appendChild(n('B'));

    (parent as any).textContent = null;
    expect(parent.childNodes.length).toBe(0);
    expect(parent.textContent).toBe('');
  });

  it('setting textContent to undefined clears children', () => {
    const parent = n('parent');
    parent.appendChild(n('A'));

    (parent as any).textContent = undefined;
    expect(parent.childNodes.length).toBe(0);
    expect(parent.textContent).toBe('');
  });
});

describe('D8: textContent on TEXT_NODE is mutable', () => {
  it('textContent setter updates text node value', () => {
    const text = new Node(Node.TEXT_NODE, 'original');
    expect(text.textContent).toBe('original');

    text.textContent = 'updated';
    expect(text.textContent).toBe('updated');
  });

  it('textContent setter on text node does not create children', () => {
    const text = new Node(Node.TEXT_NODE, 'hello');
    text.textContent = 'world';
    expect(text.hasChildNodes()).toBe(false);
    expect(text.textContent).toBe('world');
  });

  it('parent textContent reflects updated child text node', () => {
    const parent = n('parent');
    const text = new Node(Node.TEXT_NODE, 'before');
    parent.appendChild(text);
    expect(parent.textContent).toBe('before');

    text.textContent = 'after';
    expect(parent.textContent).toBe('after');
  });

  it('COMMENT_NODE textContent is also mutable', () => {
    const comment = new Node(Node.COMMENT_NODE, 'old comment');
    expect(comment.textContent).toBe('old comment');
    comment.textContent = 'new comment';
    expect(comment.textContent).toBe('new comment');
  });
});

describe('D9: node type constants on instances', () => {
  it('ELEMENT_NODE is accessible on instance', () => {
    const node = new Node(1, 'DIV');
    expect((node as any).ELEMENT_NODE).toBe(1);
  });

  it('TEXT_NODE is accessible on instance', () => {
    const node = new Node(3, '#text');
    expect((node as any).TEXT_NODE).toBe(3);
  });

  it('COMMENT_NODE is accessible on instance', () => {
    const node = new Node(1, 'DIV');
    expect((node as any).COMMENT_NODE).toBe(8);
  });

  it('DOCUMENT_NODE is accessible on instance', () => {
    const node = new Node(1, 'DIV');
    expect((node as any).DOCUMENT_NODE).toBe(9);
  });

  it('DOCUMENT_FRAGMENT_NODE is accessible on instance', () => {
    const node = new Node(1, 'DIV');
    expect((node as any).DOCUMENT_FRAGMENT_NODE).toBe(11);
  });

  it('instance constants match static constants', () => {
    const node = new Node(1, 'X');
    expect((node as any).ELEMENT_NODE).toBe(Node.ELEMENT_NODE);
    expect((node as any).TEXT_NODE).toBe(Node.TEXT_NODE);
    expect((node as any).COMMENT_NODE).toBe(Node.COMMENT_NODE);
    expect((node as any).DOCUMENT_NODE).toBe(Node.DOCUMENT_NODE);
    expect((node as any).DOCUMENT_FRAGMENT_NODE).toBe(Node.DOCUMENT_FRAGMENT_NODE);
  });
});
