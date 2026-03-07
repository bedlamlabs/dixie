import { describe, it, expect } from 'vitest';
import { Element, Text, Comment, Attr, Node, NamedNodeMap, DOMTokenList, HTMLCollection } from '../src/index';

// ═══════════════════════════════════════════════════════════════════════
// Element basics
// ═══════════════════════════════════════════════════════════════════════

describe('Element', () => {
  describe('constructor', () => {
    it('sets tagName to uppercase', () => {
      expect(new Element('div').tagName).toBe('DIV');
      expect(new Element('Span').tagName).toBe('SPAN');
      expect(new Element('ARTICLE').tagName).toBe('ARTICLE');
    });

    it('sets nodeType to ELEMENT_NODE (1)', () => {
      expect(new Element('div').nodeType).toBe(1);
    });

    it('sets nodeName to uppercase tagName', () => {
      expect(new Element('div').nodeName).toBe('DIV');
    });

    it('extends Node', () => {
      expect(new Element('div')).toBeInstanceOf(Node);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Attributes
  // ═══════════════════════════════════════════════════════════════════

  describe('attributes', () => {
    it('setAttribute and getAttribute', () => {
      const el = new Element('div');
      el.setAttribute('data-x', '42');
      expect(el.getAttribute('data-x')).toBe('42');
    });

    it('getAttribute returns null for missing attribute', () => {
      expect(new Element('div').getAttribute('nope')).toBeNull();
    });

    it('setAttribute overwrites existing value', () => {
      const el = new Element('div');
      el.setAttribute('title', 'old');
      el.setAttribute('title', 'new');
      expect(el.getAttribute('title')).toBe('new');
    });

    it('setAttribute coerces value to string', () => {
      const el = new Element('div');
      el.setAttribute('data-n', 99 as any);
      expect(el.getAttribute('data-n')).toBe('99');
    });

    it('hasAttribute returns false initially', () => {
      expect(new Element('div').hasAttribute('id')).toBe(false);
    });

    it('hasAttribute returns true after setAttribute', () => {
      const el = new Element('div');
      el.setAttribute('id', 'x');
      expect(el.hasAttribute('id')).toBe(true);
    });

    it('removeAttribute removes the attribute', () => {
      const el = new Element('div');
      el.setAttribute('id', 'x');
      el.removeAttribute('id');
      expect(el.hasAttribute('id')).toBe(false);
      expect(el.getAttribute('id')).toBeNull();
    });

    it('removeAttribute is a no-op for missing attribute', () => {
      const el = new Element('div');
      expect(() => el.removeAttribute('nope')).not.toThrow();
    });

    it('attributes are case-insensitive', () => {
      const el = new Element('div');
      el.setAttribute('ID', 'x');
      expect(el.getAttribute('id')).toBe('x');
      expect(el.getAttribute('Id')).toBe('x');
      expect(el.hasAttribute('iD')).toBe(true);
    });

    it('setAttribute with mixed case then getAttribute with lowercase', () => {
      const el = new Element('div');
      el.setAttribute('Data-Value', 'hello');
      expect(el.getAttribute('data-value')).toBe('hello');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // NamedNodeMap
  // ═══════════════════════════════════════════════════════════════════

  describe('NamedNodeMap', () => {
    it('element.attributes returns NamedNodeMap', () => {
      const el = new Element('div');
      expect(el.attributes).toBeInstanceOf(NamedNodeMap);
    });

    it('length reflects attribute count', () => {
      const el = new Element('div');
      expect(el.attributes.length).toBe(0);
      el.setAttribute('id', 'x');
      expect(el.attributes.length).toBe(1);
      el.setAttribute('class', 'y');
      expect(el.attributes.length).toBe(2);
    });

    it('item returns Attr by index', () => {
      const el = new Element('div');
      el.setAttribute('id', 'x');
      const attr = el.attributes.item(0);
      expect(attr).toBeInstanceOf(Attr);
      expect(attr!.name).toBe('id');
      expect(attr!.value).toBe('x');
    });

    it('item returns null for out-of-range index', () => {
      expect(new Element('div').attributes.item(0)).toBeNull();
      expect(new Element('div').attributes.item(-1)).toBeNull();
    });

    it('getNamedItem returns Attr or null', () => {
      const el = new Element('div');
      expect(el.attributes.getNamedItem('id')).toBeNull();
      el.setAttribute('id', 'x');
      const attr = el.attributes.getNamedItem('id');
      expect(attr).not.toBeNull();
      expect(attr!.value).toBe('x');
    });

    it('is iterable', () => {
      const el = new Element('div');
      el.setAttribute('id', 'x');
      el.setAttribute('class', 'y');
      const names = [...el.attributes].map(a => a.name);
      expect(names).toEqual(['id', 'class']);
    });

    it('removeNamedItem throws for missing attribute', () => {
      const map = new NamedNodeMap();
      expect(() => map.removeNamedItem('nope')).toThrow();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // id and className
  // ═══════════════════════════════════════════════════════════════════

  describe('id', () => {
    it('returns empty string by default', () => {
      expect(new Element('div').id).toBe('');
    });

    it('getter reads id attribute', () => {
      const el = new Element('div');
      el.setAttribute('id', 'main');
      expect(el.id).toBe('main');
    });

    it('setter writes id attribute', () => {
      const el = new Element('div');
      el.id = 'header';
      expect(el.getAttribute('id')).toBe('header');
    });
  });

  describe('className', () => {
    it('returns empty string by default', () => {
      expect(new Element('div').className).toBe('');
    });

    it('getter reads class attribute', () => {
      const el = new Element('div');
      el.setAttribute('class', 'foo bar');
      expect(el.className).toBe('foo bar');
    });

    it('setter writes class attribute', () => {
      const el = new Element('div');
      el.className = 'active highlight';
      expect(el.getAttribute('class')).toBe('active highlight');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // classList (DOMTokenList)
  // ═══════════════════════════════════════════════════════════════════

  describe('classList', () => {
    it('returns a DOMTokenList', () => {
      expect(new Element('div').classList).toBeInstanceOf(DOMTokenList);
    });

    it('add adds a class', () => {
      const el = new Element('div');
      el.classList.add('foo');
      expect(el.getAttribute('class')).toBe('foo');
    });

    it('add multiple classes', () => {
      const el = new Element('div');
      el.classList.add('foo', 'bar', 'baz');
      expect(el.className).toBe('foo bar baz');
    });

    it('add does not duplicate', () => {
      const el = new Element('div');
      el.classList.add('foo');
      el.classList.add('foo');
      expect(el.className).toBe('foo');
    });

    it('remove removes a class', () => {
      const el = new Element('div');
      el.className = 'foo bar baz';
      el.classList.remove('bar');
      expect(el.className).toBe('foo baz');
    });

    it('remove multiple classes', () => {
      const el = new Element('div');
      el.className = 'a b c d';
      el.classList.remove('b', 'd');
      expect(el.className).toBe('a c');
    });

    it('toggle adds missing class, returns true', () => {
      const el = new Element('div');
      const result = el.classList.toggle('active');
      expect(result).toBe(true);
      expect(el.classList.contains('active')).toBe(true);
    });

    it('toggle removes existing class, returns false', () => {
      const el = new Element('div');
      el.className = 'active';
      const result = el.classList.toggle('active');
      expect(result).toBe(false);
      expect(el.classList.contains('active')).toBe(false);
    });

    it('toggle with force=true always adds', () => {
      const el = new Element('div');
      el.className = 'active';
      expect(el.classList.toggle('active', true)).toBe(true);
      expect(el.classList.contains('active')).toBe(true);
    });

    it('toggle with force=false always removes', () => {
      const el = new Element('div');
      expect(el.classList.toggle('active', false)).toBe(false);
      expect(el.classList.contains('active')).toBe(false);
    });

    it('contains returns true/false', () => {
      const el = new Element('div');
      el.className = 'foo bar';
      expect(el.classList.contains('foo')).toBe(true);
      expect(el.classList.contains('baz')).toBe(false);
    });

    it('replace replaces a class', () => {
      const el = new Element('div');
      el.className = 'old middle';
      const result = el.classList.replace('old', 'new');
      expect(result).toBe(true);
      expect(el.className).toBe('new middle');
    });

    it('replace returns false if old class not found', () => {
      const el = new Element('div');
      el.className = 'foo';
      expect(el.classList.replace('bar', 'baz')).toBe(false);
    });

    it('changes are reflected in getAttribute and vice versa', () => {
      const el = new Element('div');
      el.classList.add('alpha');
      expect(el.getAttribute('class')).toBe('alpha');
      el.setAttribute('class', 'beta gamma');
      expect(el.classList.contains('beta')).toBe(true);
      expect(el.classList.contains('gamma')).toBe(true);
      expect(el.classList.contains('alpha')).toBe(false);
    });

    it('length returns token count', () => {
      const el = new Element('div');
      expect(el.classList.length).toBe(0);
      el.className = 'a b c';
      expect(el.classList.length).toBe(3);
    });

    it('item returns token by index', () => {
      const el = new Element('div');
      el.className = 'a b c';
      expect(el.classList.item(0)).toBe('a');
      expect(el.classList.item(1)).toBe('b');
      expect(el.classList.item(3)).toBeNull();
    });

    it('value getter and setter', () => {
      const el = new Element('div');
      el.classList.add('x');
      expect(el.classList.value).toBe('x');
      el.classList.value = 'y z';
      expect(el.classList.contains('y')).toBe(true);
      expect(el.classList.contains('z')).toBe(true);
    });

    it('forEach iterates over tokens', () => {
      const el = new Element('div');
      el.className = 'a b';
      const collected: string[] = [];
      el.classList.forEach((val) => collected.push(val));
      expect(collected).toEqual(['a', 'b']);
    });

    it('is iterable with for...of', () => {
      const el = new Element('div');
      el.className = 'x y z';
      const collected = [...el.classList];
      expect(collected).toEqual(['x', 'y', 'z']);
    });

    it('toString returns the class string', () => {
      const el = new Element('div');
      el.className = 'foo bar';
      expect(el.classList.toString()).toBe('foo bar');
    });

    it('add throws on empty string', () => {
      const el = new Element('div');
      expect(() => el.classList.add('')).toThrow();
    });

    it('add throws on token with spaces', () => {
      const el = new Element('div');
      expect(() => el.classList.add('foo bar')).toThrow();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Element child traversal
  // ═══════════════════════════════════════════════════════════════════

  describe('element child traversal', () => {
    it('children returns only Element children', () => {
      const parent = new Element('div');
      const child1 = new Element('span');
      const text = new Text('hello');
      const child2 = new Element('p');
      const comment = new Comment('test');
      parent.appendChild(child1);
      parent.appendChild(text);
      parent.appendChild(child2);
      parent.appendChild(comment);

      expect(parent.children.length).toBe(2);
      expect(parent.children.item(0)).toBe(child1);
      expect(parent.children.item(1)).toBe(child2);
    });

    it('children is a live collection', () => {
      const parent = new Element('div');
      const children = parent.children;
      expect(children.length).toBe(0);

      parent.appendChild(new Element('span'));
      expect(children.length).toBe(1);

      parent.appendChild(new Text('text'));
      expect(children.length).toBe(1); // text doesn't count

      parent.appendChild(new Element('p'));
      expect(children.length).toBe(2);
    });

    it('children returns HTMLCollection', () => {
      expect(new Element('div').children).toBeInstanceOf(HTMLCollection);
    });

    it('children is iterable', () => {
      const parent = new Element('div');
      const a = new Element('a');
      const b = new Element('b');
      parent.appendChild(a);
      parent.appendChild(new Text('txt'));
      parent.appendChild(b);
      const tags = [...parent.children].map(c => (c as Element).tagName);
      expect(tags).toEqual(['A', 'B']);
    });

    it('childElementCount returns element child count', () => {
      const parent = new Element('div');
      expect(parent.childElementCount).toBe(0);
      parent.appendChild(new Element('span'));
      parent.appendChild(new Text('hi'));
      parent.appendChild(new Element('p'));
      expect(parent.childElementCount).toBe(2);
    });

    it('firstElementChild skips non-element nodes', () => {
      const parent = new Element('div');
      parent.appendChild(new Text('text'));
      parent.appendChild(new Comment('comment'));
      const span = new Element('span');
      parent.appendChild(span);
      expect(parent.firstElementChild).toBe(span);
    });

    it('firstElementChild returns null when no element children', () => {
      const parent = new Element('div');
      parent.appendChild(new Text('text'));
      expect(parent.firstElementChild).toBeNull();
    });

    it('lastElementChild skips non-element nodes', () => {
      const parent = new Element('div');
      const span = new Element('span');
      parent.appendChild(span);
      parent.appendChild(new Text('text'));
      parent.appendChild(new Comment('comment'));
      expect(parent.lastElementChild).toBe(span);
    });

    it('lastElementChild returns null when no element children', () => {
      expect(new Element('div').lastElementChild).toBeNull();
    });

    it('nextElementSibling skips non-element nodes', () => {
      const parent = new Element('div');
      const a = new Element('a');
      const text = new Text('text');
      const comment = new Comment('c');
      const b = new Element('b');
      parent.appendChild(a);
      parent.appendChild(text);
      parent.appendChild(comment);
      parent.appendChild(b);
      expect(a.nextElementSibling).toBe(b);
    });

    it('nextElementSibling returns null at end', () => {
      const parent = new Element('div');
      const a = new Element('a');
      parent.appendChild(a);
      parent.appendChild(new Text('end'));
      expect(a.nextElementSibling).toBeNull();
    });

    it('previousElementSibling skips non-element nodes', () => {
      const parent = new Element('div');
      const a = new Element('a');
      const text = new Text('text');
      const b = new Element('b');
      parent.appendChild(a);
      parent.appendChild(text);
      parent.appendChild(b);
      expect(b.previousElementSibling).toBe(a);
    });

    it('previousElementSibling returns null at start', () => {
      const parent = new Element('div');
      const text = new Text('start');
      const a = new Element('a');
      parent.appendChild(text);
      parent.appendChild(a);
      expect(a.previousElementSibling).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Convenience mutation methods
  // ═══════════════════════════════════════════════════════════════════

  describe('append', () => {
    it('appends a single element', () => {
      const parent = new Element('div');
      const child = new Element('span');
      parent.append(child);
      expect(parent.childNodes.length).toBe(1);
      expect(parent.firstChild).toBe(child);
    });

    it('appends multiple nodes', () => {
      const parent = new Element('div');
      const a = new Element('a');
      const b = new Element('b');
      parent.append(a, b);
      expect(parent.childNodes.length).toBe(2);
    });

    it('strings become Text nodes', () => {
      const parent = new Element('div');
      parent.append('hello');
      expect(parent.childNodes.length).toBe(1);
      expect(parent.firstChild!.nodeType).toBe(Node.TEXT_NODE);
      expect(parent.textContent).toBe('hello');
    });

    it('mixed nodes and strings', () => {
      const parent = new Element('div');
      parent.append('before', new Element('span'), 'after');
      expect(parent.childNodes.length).toBe(3);
      expect(parent.childNodes.item(0)!.nodeType).toBe(Node.TEXT_NODE);
      expect(parent.childNodes.item(1)!.nodeType).toBe(Node.ELEMENT_NODE);
      expect(parent.childNodes.item(2)!.nodeType).toBe(Node.TEXT_NODE);
    });
  });

  describe('prepend', () => {
    it('inserts at the beginning', () => {
      const parent = new Element('div');
      const existing = new Element('p');
      parent.appendChild(existing);
      const newEl = new Element('span');
      parent.prepend(newEl);
      expect(parent.firstChild).toBe(newEl);
      expect(parent.lastChild).toBe(existing);
    });

    it('strings become Text nodes at beginning', () => {
      const parent = new Element('div');
      parent.appendChild(new Element('span'));
      parent.prepend('first');
      expect(parent.firstChild!.nodeType).toBe(Node.TEXT_NODE);
      expect((parent.firstChild as any).data).toBe('first');
    });

    it('multiple args preserve order', () => {
      const parent = new Element('div');
      parent.prepend('a', 'b', 'c');
      expect(parent.textContent).toBe('abc');
    });
  });

  describe('after', () => {
    it('inserts siblings after this element', () => {
      const parent = new Element('div');
      const a = new Element('a');
      const c = new Element('c');
      parent.appendChild(a);
      parent.appendChild(c);
      const b = new Element('b');
      a.after(b);
      expect(parent.childNodes.item(1)).toBe(b);
      expect(parent.childNodes.item(2)).toBe(c);
    });

    it('strings become Text nodes', () => {
      const parent = new Element('div');
      const a = new Element('a');
      parent.appendChild(a);
      a.after('text');
      expect(parent.childNodes.length).toBe(2);
      expect(parent.lastChild!.nodeType).toBe(Node.TEXT_NODE);
    });

    it('does nothing if no parent', () => {
      const orphan = new Element('div');
      expect(() => orphan.after(new Element('span'))).not.toThrow();
    });
  });

  describe('before', () => {
    it('inserts siblings before this element', () => {
      const parent = new Element('div');
      const b = new Element('b');
      parent.appendChild(b);
      const a = new Element('a');
      b.before(a);
      expect(parent.firstChild).toBe(a);
      expect(parent.lastChild).toBe(b);
    });

    it('strings become Text nodes', () => {
      const parent = new Element('div');
      const el = new Element('span');
      parent.appendChild(el);
      el.before('prefix');
      expect(parent.firstChild!.nodeType).toBe(Node.TEXT_NODE);
    });

    it('does nothing if no parent', () => {
      const orphan = new Element('div');
      expect(() => orphan.before(new Element('span'))).not.toThrow();
    });
  });

  describe('remove', () => {
    it('detaches element from parent', () => {
      const parent = new Element('div');
      const child = new Element('span');
      parent.appendChild(child);
      child.remove();
      expect(parent.childNodes.length).toBe(0);
      expect(child.parentNode).toBeNull();
    });

    it('does nothing if no parent', () => {
      const orphan = new Element('div');
      expect(() => orphan.remove()).not.toThrow();
    });
  });

  describe('replaceWith', () => {
    it('replaces this element with new nodes', () => {
      const parent = new Element('div');
      const old = new Element('span');
      parent.appendChild(old);
      const replacement = new Element('p');
      old.replaceWith(replacement);
      expect(parent.childNodes.length).toBe(1);
      expect(parent.firstChild).toBe(replacement);
      expect(old.parentNode).toBeNull();
    });

    it('replaces with multiple nodes', () => {
      const parent = new Element('div');
      const old = new Element('span');
      parent.appendChild(old);
      old.replaceWith('text', new Element('p'));
      expect(parent.childNodes.length).toBe(2);
      expect(parent.firstChild!.nodeType).toBe(Node.TEXT_NODE);
      expect(parent.lastChild!.nodeType).toBe(Node.ELEMENT_NODE);
    });

    it('does nothing if no parent', () => {
      const orphan = new Element('div');
      expect(() => orphan.replaceWith(new Element('p'))).not.toThrow();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // cloneNode
  // ═══════════════════════════════════════════════════════════════════

  describe('cloneNode', () => {
    it('shallow clone copies attributes but not children', () => {
      const el = new Element('div');
      el.id = 'main';
      el.className = 'container';
      el.appendChild(new Element('span'));

      const clone = el.cloneNode(false);
      expect(clone.tagName).toBe('DIV');
      expect(clone.id).toBe('main');
      expect(clone.className).toBe('container');
      expect(clone.childNodes.length).toBe(0);
    });

    it('deep clone copies children too', () => {
      const el = new Element('div');
      el.appendChild(new Element('span'));
      el.appendChild(new Text('text'));

      const clone = el.cloneNode(true);
      expect(clone.childNodes.length).toBe(2);
      expect((clone.firstChild as Element).tagName).toBe('SPAN');
      expect(clone.firstChild).not.toBe(el.firstChild); // different instance
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // textContent
  // ═══════════════════════════════════════════════════════════════════

  describe('textContent', () => {
    it('returns concatenated text of descendants', () => {
      const el = new Element('div');
      el.appendChild(new Text('hello '));
      const span = new Element('span');
      span.appendChild(new Text('world'));
      el.appendChild(span);
      expect(el.textContent).toBe('hello world');
    });

    it('setter replaces children with single Text node', () => {
      const el = new Element('div');
      el.appendChild(new Element('span'));
      el.textContent = 'replaced';
      expect(el.childNodes.length).toBe(1);
      expect(el.firstChild!.nodeType).toBe(Node.TEXT_NODE);
      expect(el.textContent).toBe('replaced');
    });

    it('setter with empty string removes all children', () => {
      const el = new Element('div');
      el.appendChild(new Element('span'));
      el.textContent = '';
      expect(el.childNodes.length).toBe(0);
    });

    it('skips comment nodes in textContent getter', () => {
      const el = new Element('div');
      el.appendChild(new Text('visible'));
      el.appendChild(new Comment('hidden'));
      expect(el.textContent).toBe('visible');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // HTMLCollection namedItem
  // ═══════════════════════════════════════════════════════════════════

  describe('HTMLCollection.namedItem', () => {
    it('finds element by id', () => {
      const parent = new Element('div');
      const child = new Element('span');
      child.id = 'mySpan';
      parent.appendChild(child);
      expect(parent.children.namedItem('mySpan')).toBe(child);
    });

    it('returns null when not found', () => {
      const parent = new Element('div');
      expect(parent.children.namedItem('nope')).toBeNull();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Text class
// ═══════════════════════════════════════════════════════════════════════

describe('Text', () => {
  it('constructor sets data', () => {
    expect(new Text('hello').data).toBe('hello');
  });

  it('default data is empty string', () => {
    expect(new Text().data).toBe('');
  });

  it('nodeType is TEXT_NODE (3)', () => {
    expect(new Text('x').nodeType).toBe(3);
  });

  it('nodeName is #text', () => {
    expect(new Text('x').nodeName).toBe('#text');
  });

  it('textContent returns data', () => {
    expect(new Text('hello').textContent).toBe('hello');
  });

  it('textContent setter updates data', () => {
    const t = new Text('old');
    t.textContent = 'new';
    expect(t.data).toBe('new');
  });

  it('length returns data length', () => {
    expect(new Text('hello').length).toBe(5);
    expect(new Text('').length).toBe(0);
  });

  it('nodeValue returns data', () => {
    expect(new Text('test').nodeValue).toBe('test');
  });

  it('extends Node', () => {
    expect(new Text('x')).toBeInstanceOf(Node);
  });

  describe('splitText', () => {
    it('splits at offset and returns remainder', () => {
      const parent = new Element('div');
      const text = new Text('hello world');
      parent.appendChild(text);

      const remainder = text.splitText(5);
      expect(text.data).toBe('hello');
      expect(remainder.data).toBe(' world');
      expect(parent.childNodes.length).toBe(2);
      expect(parent.childNodes.item(1)).toBe(remainder);
    });

    it('splits at 0 returns entire text as remainder', () => {
      const t = new Text('abc');
      const r = t.splitText(0);
      expect(t.data).toBe('');
      expect(r.data).toBe('abc');
    });

    it('splits at end returns empty remainder', () => {
      const t = new Text('abc');
      const r = t.splitText(3);
      expect(t.data).toBe('abc');
      expect(r.data).toBe('');
    });

    it('throws for negative offset', () => {
      expect(() => new Text('abc').splitText(-1)).toThrow();
    });

    it('throws for offset beyond length', () => {
      expect(() => new Text('abc').splitText(4)).toThrow();
    });
  });

  describe('wholeText', () => {
    it('returns data when no adjacent text nodes', () => {
      const t = new Text('hello');
      expect(t.wholeText).toBe('hello');
    });

    it('concatenates adjacent text nodes', () => {
      const parent = new Element('div');
      const t1 = new Text('hello');
      const t2 = new Text(' world');
      parent.appendChild(t1);
      parent.appendChild(t2);
      expect(t1.wholeText).toBe('hello world');
      expect(t2.wholeText).toBe('hello world');
    });

    it('stops at non-text siblings', () => {
      const parent = new Element('div');
      const t1 = new Text('a');
      const el = new Element('span');
      const t2 = new Text('b');
      parent.appendChild(t1);
      parent.appendChild(el);
      parent.appendChild(t2);
      expect(t1.wholeText).toBe('a');
      expect(t2.wholeText).toBe('b');
    });
  });

  describe('cloneNode', () => {
    it('returns a new Text with same data', () => {
      const t = new Text('hello');
      const clone = t.cloneNode();
      expect(clone).toBeInstanceOf(Text);
      expect(clone.data).toBe('hello');
      expect(clone).not.toBe(t);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Comment class
// ═══════════════════════════════════════════════════════════════════════

describe('Comment', () => {
  it('constructor sets data', () => {
    expect(new Comment('test').data).toBe('test');
  });

  it('default data is empty string', () => {
    expect(new Comment().data).toBe('');
  });

  it('nodeType is COMMENT_NODE (8)', () => {
    expect(new Comment('x').nodeType).toBe(8);
  });

  it('nodeName is #comment', () => {
    expect(new Comment('x').nodeName).toBe('#comment');
  });

  it('data is mutable', () => {
    const c = new Comment('old');
    c.data = 'new';
    expect(c.data).toBe('new');
  });

  it('length returns data length', () => {
    expect(new Comment('hello').length).toBe(5);
  });

  it('nodeValue returns data', () => {
    expect(new Comment('test').nodeValue).toBe('test');
  });

  it('extends Node', () => {
    expect(new Comment('x')).toBeInstanceOf(Node);
  });

  it('cloneNode returns new Comment with same data', () => {
    const c = new Comment('hello');
    const clone = c.cloneNode();
    expect(clone).toBeInstanceOf(Comment);
    expect(clone.data).toBe('hello');
    expect(clone).not.toBe(c);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Attr class
// ═══════════════════════════════════════════════════════════════════════

describe('Attr', () => {
  it('stores name and value', () => {
    const attr = new Attr('id', 'main');
    expect(attr.name).toBe('id');
    expect(attr.value).toBe('main');
  });

  it('defaults value to empty string', () => {
    expect(new Attr('disabled').value).toBe('');
  });

  it('ownerElement is null by default', () => {
    expect(new Attr('id', 'x').ownerElement).toBeNull();
  });
});
