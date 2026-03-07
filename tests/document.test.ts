import { describe, it, expect } from 'vitest';
import {
  Document,
  DocumentFragment,
  Element,
  HTMLButtonElement,
  Text,
  Comment,
  HTMLFormElement,
  HTMLInputElement,
  HTMLLabelElement,
  Node,
  HTMLCollection,
  HTMLOptionElement,
  NodeList,
  HTMLSelectElement,
  HTMLTextAreaElement,
} from '../src/index';

// ═══════════════════════════════════════════════════════════════════════
// Document
// ═══════════════════════════════════════════════════════════════════════

describe('Document', () => {
  describe('constructor', () => {
    it('sets nodeType to DOCUMENT_NODE (9)', () => {
      expect(new Document().nodeType).toBe(9);
    });

    it('sets nodeName to #document', () => {
      expect(new Document().nodeName).toBe('#document');
    });

    it('extends Node', () => {
      expect(new Document()).toBeInstanceOf(Node);
    });

    it('auto-creates documentElement (<html>)', () => {
      const doc = new Document();
      expect(doc.documentElement).toBeInstanceOf(Element);
      expect(doc.documentElement.tagName).toBe('HTML');
    });

    it('auto-creates head as child of documentElement', () => {
      const doc = new Document();
      expect(doc.head).toBeInstanceOf(Element);
      expect(doc.head.tagName).toBe('HEAD');
      expect(doc.head.parentNode).toBe(doc.documentElement);
    });

    it('auto-creates body as child of documentElement', () => {
      const doc = new Document();
      expect(doc.body).toBeInstanceOf(Element);
      expect(doc.body.tagName).toBe('BODY');
      expect(doc.body.parentNode).toBe(doc.documentElement);
    });

    it('documentElement is child of document', () => {
      const doc = new Document();
      expect(doc.documentElement.parentNode).toBe(doc);
      expect(doc.firstChild).toBe(doc.documentElement);
    });

    it('head comes before body in the tree', () => {
      const doc = new Document();
      expect(doc.head.nextSibling).toBe(doc.body);
      expect(doc.body.previousSibling).toBe(doc.head);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Factory methods
  // ═══════════════════════════════════════════════════════════════════

  describe('createElement', () => {
    it('returns Element with uppercase tagName', () => {
      const doc = new Document();
      const div = doc.createElement('div');
      expect(div).toBeInstanceOf(Element);
      expect(div.tagName).toBe('DIV');
    });

    it('sets ownerDocument on created element', () => {
      const doc = new Document();
      const span = doc.createElement('span');
      expect(span.ownerDocument).toBe(doc);
    });

    it('handles mixed-case tagName', () => {
      const doc = new Document();
      expect(doc.createElement('Section').tagName).toBe('SECTION');
    });

    it('returns specialized form elements for supported tags', () => {
      const doc = new Document();

      expect(doc.createElement('form')).toBeInstanceOf(HTMLFormElement);
      expect(doc.createElement('input')).toBeInstanceOf(HTMLInputElement);
      expect(doc.createElement('select')).toBeInstanceOf(HTMLSelectElement);
      expect(doc.createElement('textarea')).toBeInstanceOf(HTMLTextAreaElement);
      expect(doc.createElement('button')).toBeInstanceOf(HTMLButtonElement);
      expect(doc.createElement('option')).toBeInstanceOf(HTMLOptionElement);
      expect(doc.createElement('label')).toBeInstanceOf(HTMLLabelElement);
    });
  });

  describe('createTextNode', () => {
    it('returns Text node with given data', () => {
      const doc = new Document();
      const text = doc.createTextNode('hello');
      expect(text).toBeInstanceOf(Text);
      expect(text.data).toBe('hello');
    });

    it('sets ownerDocument on created text node', () => {
      const doc = new Document();
      const text = doc.createTextNode('test');
      expect(text.ownerDocument).toBe(doc);
    });

    it('creates text node with empty string', () => {
      const doc = new Document();
      const text = doc.createTextNode('');
      expect(text.data).toBe('');
    });
  });

  describe('createComment', () => {
    it('returns Comment node with given data', () => {
      const doc = new Document();
      const comment = doc.createComment('note');
      expect(comment).toBeInstanceOf(Comment);
      expect(comment.data).toBe('note');
    });

    it('sets ownerDocument on created comment', () => {
      const doc = new Document();
      const comment = doc.createComment('test');
      expect(comment.ownerDocument).toBe(doc);
    });
  });

  describe('createDocumentFragment', () => {
    it('returns DocumentFragment with no children', () => {
      const doc = new Document();
      const frag = doc.createDocumentFragment();
      expect(frag).toBeInstanceOf(DocumentFragment);
      expect(frag.childNodes.length).toBe(0);
    });

    it('sets ownerDocument on created fragment', () => {
      const doc = new Document();
      const frag = doc.createDocumentFragment();
      expect(frag.ownerDocument).toBe(doc);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // getElementById
  // ═══════════════════════════════════════════════════════════════════

  describe('getElementById', () => {
    it('finds element by id in the tree', () => {
      const doc = new Document();
      const div = doc.createElement('div');
      div.id = 'foo';
      doc.body.appendChild(div);
      expect(doc.getElementById('foo')).toBe(div);
    });

    it('returns null when id is not found', () => {
      const doc = new Document();
      expect(doc.getElementById('nonexistent')).toBeNull();
    });

    it('finds deeply nested elements', () => {
      const doc = new Document();
      const outer = doc.createElement('div');
      const inner = doc.createElement('span');
      const deep = doc.createElement('a');
      deep.id = 'deep-link';
      outer.appendChild(inner);
      inner.appendChild(deep);
      doc.body.appendChild(outer);
      expect(doc.getElementById('deep-link')).toBe(deep);
    });

    it('returns first matching element in document order', () => {
      const doc = new Document();
      const first = doc.createElement('div');
      first.id = 'dup';
      const second = doc.createElement('div');
      second.id = 'dup';
      doc.body.appendChild(first);
      doc.body.appendChild(second);
      expect(doc.getElementById('dup')).toBe(first);
    });

    it('finds elements in head', () => {
      const doc = new Document();
      const meta = doc.createElement('meta');
      meta.id = 'meta-tag';
      doc.head.appendChild(meta);
      expect(doc.getElementById('meta-tag')).toBe(meta);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // getElementsByTagName
  // ═══════════════════════════════════════════════════════════════════

  describe('getElementsByTagName', () => {
    it('returns all elements with matching tag name', () => {
      const doc = new Document();
      const d1 = doc.createElement('div');
      const d2 = doc.createElement('div');
      const span = doc.createElement('span');
      doc.body.append(d1, span, d2);

      const divs = doc.getElementsByTagName('div');
      expect(divs.length).toBe(2);
    });

    it('is case-insensitive', () => {
      const doc = new Document();
      doc.body.appendChild(doc.createElement('div'));
      expect(doc.getElementsByTagName('DIV').length).toBe(1);
      expect(doc.getElementsByTagName('Div').length).toBe(1);
    });

    it('wildcard * returns all elements', () => {
      const doc = new Document();
      doc.body.appendChild(doc.createElement('div'));
      doc.body.appendChild(doc.createElement('span'));
      // html, head, body, div, span = 5
      const all = doc.getElementsByTagName('*');
      expect(all.length).toBe(5);
    });

    it('returns a live collection', () => {
      const doc = new Document();
      const divs = doc.getElementsByTagName('div');
      expect(divs.length).toBe(0);
      doc.body.appendChild(doc.createElement('div'));
      expect(divs.length).toBe(1);
    });

    it('returns empty collection for unmatched tag', () => {
      const doc = new Document();
      expect(doc.getElementsByTagName('article').length).toBe(0);
    });

    it('includes nested elements in document order', () => {
      const doc = new Document();
      const outer = doc.createElement('div');
      const inner = doc.createElement('div');
      outer.appendChild(inner);
      doc.body.appendChild(outer);
      const divs = doc.getElementsByTagName('div');
      expect(divs.item(0)).toBe(outer);
      expect(divs.item(1)).toBe(inner);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // getElementsByClassName
  // ═══════════════════════════════════════════════════════════════════

  describe('getElementsByClassName', () => {
    it('returns elements with matching class', () => {
      const doc = new Document();
      const a = doc.createElement('div');
      a.className = 'foo';
      const b = doc.createElement('span');
      b.className = 'bar';
      const c = doc.createElement('p');
      c.className = 'foo';
      doc.body.append(a, b, c);

      const foos = doc.getElementsByClassName('foo');
      expect(foos.length).toBe(2);
    });

    it('multiple classes requires all to match', () => {
      const doc = new Document();
      const el = doc.createElement('div');
      el.className = 'foo bar baz';
      doc.body.appendChild(el);

      expect(doc.getElementsByClassName('foo bar').length).toBe(1);
      expect(doc.getElementsByClassName('foo qux').length).toBe(0);
    });

    it('returns a live collection', () => {
      const doc = new Document();
      const result = doc.getElementsByClassName('active');
      expect(result.length).toBe(0);
      const el = doc.createElement('div');
      el.className = 'active';
      doc.body.appendChild(el);
      expect(result.length).toBe(1);
    });

    it('returns empty collection for empty class string', () => {
      const doc = new Document();
      doc.body.appendChild(doc.createElement('div'));
      expect(doc.getElementsByClassName('').length).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // title
  // ═══════════════════════════════════════════════════════════════════

  describe('title', () => {
    it('returns empty string when no <title> exists', () => {
      const doc = new Document();
      expect(doc.title).toBe('');
    });

    it('setter creates <title> in head if missing', () => {
      const doc = new Document();
      doc.title = 'My Page';
      expect(doc.title).toBe('My Page');
      // Verify a TITLE element was added to head
      const titles = doc.head.getElementsByTagName('title');
      expect(titles.length).toBe(1);
    });

    it('setter updates existing <title>', () => {
      const doc = new Document();
      doc.title = 'First';
      doc.title = 'Second';
      expect(doc.title).toBe('Second');
      // Still only one title element
      expect(doc.head.getElementsByTagName('title').length).toBe(1);
    });

    it('reads text content of manually created <title>', () => {
      const doc = new Document();
      const title = doc.createElement('title');
      title.textContent = 'Manual Title';
      doc.head.appendChild(title);
      expect(doc.title).toBe('Manual Title');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // querySelector stubs
  // ═══════════════════════════════════════════════════════════════════

  describe('querySelector stubs', () => {
    it('querySelector returns null', () => {
      const doc = new Document();
      expect(doc.querySelector('div')).toBeNull();
    });

    it('querySelectorAll returns empty NodeList', () => {
      const doc = new Document();
      const result = doc.querySelectorAll('div');
      expect(result.length).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // ownerDocument on auto-created skeleton
  // ═══════════════════════════════════════════════════════════════════

  describe('ownerDocument', () => {
    it('documentElement has ownerDocument set to document', () => {
      const doc = new Document();
      expect(doc.documentElement.ownerDocument).toBe(doc);
    });

    it('head has ownerDocument set to document', () => {
      const doc = new Document();
      expect(doc.head.ownerDocument).toBe(doc);
    });

    it('body has ownerDocument set to document', () => {
      const doc = new Document();
      expect(doc.body.ownerDocument).toBe(doc);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// DocumentFragment
// ═══════════════════════════════════════════════════════════════════════

describe('DocumentFragment', () => {
  describe('constructor', () => {
    it('sets nodeType to DOCUMENT_FRAGMENT_NODE (11)', () => {
      expect(new DocumentFragment().nodeType).toBe(11);
    });

    it('sets nodeName to #document-fragment', () => {
      expect(new DocumentFragment().nodeName).toBe('#document-fragment');
    });

    it('extends Node', () => {
      expect(new DocumentFragment()).toBeInstanceOf(Node);
    });

    it('starts with no children', () => {
      expect(new DocumentFragment().childNodes.length).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Fragment adoption (children move, not copy)
  // ═══════════════════════════════════════════════════════════════════

  describe('adoption on appendChild', () => {
    it('moves children into parent, leaving fragment empty', () => {
      const doc = new Document();
      const frag = doc.createDocumentFragment();
      const a = doc.createElement('div');
      const b = doc.createElement('span');
      frag.appendChild(a);
      frag.appendChild(b);

      doc.body.appendChild(frag);

      expect(doc.body.childNodes.length).toBe(2);
      expect(doc.body.firstChild).toBe(a);
      expect(doc.body.lastChild).toBe(b);
      expect(frag.childNodes.length).toBe(0);
    });

    it('moves children via insertBefore', () => {
      const doc = new Document();
      const existing = doc.createElement('p');
      doc.body.appendChild(existing);

      const frag = doc.createDocumentFragment();
      frag.appendChild(doc.createElement('div'));
      frag.appendChild(doc.createElement('span'));

      doc.body.insertBefore(frag, existing);

      expect(doc.body.childNodes.length).toBe(3);
      expect((doc.body.lastChild as Element).tagName).toBe('P');
      expect(frag.childNodes.length).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // append / prepend
  // ═══════════════════════════════════════════════════════════════════

  describe('append', () => {
    it('appends nodes to fragment', () => {
      const frag = new DocumentFragment();
      const el = new Element('div');
      frag.append(el);
      expect(frag.childNodes.length).toBe(1);
      expect(frag.firstChild).toBe(el);
    });

    it('strings become Text nodes', () => {
      const frag = new DocumentFragment();
      frag.append('hello');
      expect(frag.firstChild!.nodeType).toBe(Node.TEXT_NODE);
      expect(frag.textContent).toBe('hello');
    });

    it('mixed nodes and strings', () => {
      const frag = new DocumentFragment();
      frag.append('text', new Element('div'), 'more');
      expect(frag.childNodes.length).toBe(3);
    });
  });

  describe('prepend', () => {
    it('inserts at the beginning', () => {
      const frag = new DocumentFragment();
      const existing = new Element('p');
      frag.appendChild(existing);
      const first = new Element('div');
      frag.prepend(first);
      expect(frag.firstChild).toBe(first);
      expect(frag.lastChild).toBe(existing);
    });

    it('strings become Text nodes', () => {
      const frag = new DocumentFragment();
      frag.appendChild(new Element('span'));
      frag.prepend('prefix');
      expect(frag.firstChild!.nodeType).toBe(Node.TEXT_NODE);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // getElementById
  // ═══════════════════════════════════════════════════════════════════

  describe('getElementById', () => {
    it('finds element by id within fragment', () => {
      const frag = new DocumentFragment();
      const el = new Element('div');
      el.id = 'target';
      frag.appendChild(el);
      expect(frag.getElementById('target')).toBe(el);
    });

    it('returns null when not found', () => {
      const frag = new DocumentFragment();
      expect(frag.getElementById('nope')).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // getElementsByTagName / getElementsByClassName
  // ═══════════════════════════════════════════════════════════════════

  describe('getElementsByTagName', () => {
    it('finds elements within fragment', () => {
      const frag = new DocumentFragment();
      frag.appendChild(new Element('div'));
      frag.appendChild(new Element('span'));
      frag.appendChild(new Element('div'));
      expect(frag.getElementsByTagName('div').length).toBe(2);
    });
  });

  describe('getElementsByClassName', () => {
    it('finds elements by class within fragment', () => {
      const frag = new DocumentFragment();
      const a = new Element('div');
      a.className = 'active';
      const b = new Element('span');
      b.className = 'inactive';
      frag.append(a, b);
      expect(frag.getElementsByClassName('active').length).toBe(1);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Element.getElementsByClassName / getElementsByTagName
// ═══════════════════════════════════════════════════════════════════════

describe('Element.getElementsByClassName', () => {
  it('searches within element subtree only', () => {
    const doc = new Document();
    const container = doc.createElement('div');
    const inner = doc.createElement('span');
    inner.className = 'target';
    container.appendChild(inner);
    doc.body.appendChild(container);

    // Also add one outside the container
    const outside = doc.createElement('p');
    outside.className = 'target';
    doc.body.appendChild(outside);

    // Scoped search should only find the one inside container
    const result = container.getElementsByClassName('target');
    expect(result.length).toBe(1);
    expect(result.item(0)).toBe(inner);
  });
});

describe('Element.getElementsByTagName', () => {
  it('searches within element subtree only', () => {
    const doc = new Document();
    const container = doc.createElement('div');
    const innerDiv = doc.createElement('div');
    container.appendChild(innerDiv);
    doc.body.appendChild(container);

    // Also add a sibling div
    doc.body.appendChild(doc.createElement('div'));

    // Scoped search should find only the nested div, not the sibling
    const result = container.getElementsByTagName('div');
    expect(result.length).toBe(1);
    expect(result.item(0)).toBe(innerDiv);
  });

  it('wildcard * returns all descendant elements', () => {
    const parent = new Element('div');
    parent.appendChild(new Element('span'));
    parent.appendChild(new Element('p'));
    const nested = new Element('a');
    (parent.firstChild as Element).appendChild(nested);

    expect(parent.getElementsByTagName('*').length).toBe(3);
  });
});
