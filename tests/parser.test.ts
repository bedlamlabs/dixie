import { describe, it, expect } from 'vitest';
import { Document, Element, Node, parseHTML, serializeHTML } from '../src';
import { tokenize, decodeEntities } from '../src/parser/HTMLTokenizer';
import { isVoidElement } from '../src/parser/HTMLParser';

// ── Helpers ─────────────────────────────────────────────────────────

function createDoc(): Document {
  return new Document();
}

function createEl(tag: string = 'div'): Element {
  const doc = createDoc();
  return doc.createElement(tag);
}

// ════════════════════════════════════════════════════════════════════
// HTMLTokenizer
// ════════════════════════════════════════════════════════════════════

describe('HTMLTokenizer', () => {
  describe('tokenize', () => {
    it('tokenizes plain text', () => {
      const tokens = tokenize('hello world');
      expect(tokens).toEqual([{ type: 'Text', data: 'hello world' }]);
    });

    it('tokenizes a simple opening and closing tag', () => {
      const tokens = tokenize('<div></div>');
      expect(tokens).toEqual([
        { type: 'StartTag', tagName: 'div', attributes: [], selfClosing: false },
        { type: 'EndTag', tagName: 'div' },
      ]);
    });

    it('tokenizes tag with text content', () => {
      const tokens = tokenize('<span>hello</span>');
      expect(tokens).toHaveLength(3);
      expect(tokens[0]).toEqual({ type: 'StartTag', tagName: 'span', attributes: [], selfClosing: false });
      expect(tokens[1]).toEqual({ type: 'Text', data: 'hello' });
      expect(tokens[2]).toEqual({ type: 'EndTag', tagName: 'span' });
    });

    it('tokenizes self-closing tags', () => {
      const tokens = tokenize('<br/>');
      expect(tokens).toEqual([
        { type: 'StartTag', tagName: 'br', attributes: [], selfClosing: true },
      ]);
    });

    it('tokenizes attributes with double quotes', () => {
      const tokens = tokenize('<a href="/page" class="link">click</a>');
      expect(tokens[0]).toEqual({
        type: 'StartTag',
        tagName: 'a',
        attributes: [
          { name: 'href', value: '/page' },
          { name: 'class', value: 'link' },
        ],
        selfClosing: false,
      });
    });

    it('tokenizes attributes with single quotes', () => {
      const tokens = tokenize("<div id='main'></div>");
      expect(tokens[0]).toEqual({
        type: 'StartTag',
        tagName: 'div',
        attributes: [{ name: 'id', value: 'main' }],
        selfClosing: false,
      });
    });

    it('tokenizes boolean attributes', () => {
      const tokens = tokenize('<input disabled required>');
      expect(tokens[0]).toEqual({
        type: 'StartTag',
        tagName: 'input',
        attributes: [
          { name: 'disabled', value: '' },
          { name: 'required', value: '' },
        ],
        selfClosing: false,
      });
    });

    it('tokenizes HTML comments', () => {
      const tokens = tokenize('<!-- comment -->');
      expect(tokens).toEqual([{ type: 'Comment', data: ' comment ' }]);
    });

    it('tokenizes mixed content', () => {
      const tokens = tokenize('before<span>middle</span>after');
      expect(tokens).toHaveLength(5);
      expect(tokens[0]).toEqual({ type: 'Text', data: 'before' });
      expect(tokens[1]).toEqual({ type: 'StartTag', tagName: 'span', attributes: [], selfClosing: false });
      expect(tokens[2]).toEqual({ type: 'Text', data: 'middle' });
      expect(tokens[3]).toEqual({ type: 'EndTag', tagName: 'span' });
      expect(tokens[4]).toEqual({ type: 'Text', data: 'after' });
    });

    it('handles empty string', () => {
      expect(tokenize('')).toEqual([]);
    });

    it('decodes entities in text', () => {
      const tokens = tokenize('&amp; &lt; &gt; &quot; &#39;');
      expect(tokens[0]).toEqual({ type: 'Text', data: '& < > " \'' });
    });

    it('decodes entities in attribute values', () => {
      const tokens = tokenize('<div title="a&amp;b"></div>');
      expect((tokens[0] as any).attributes[0].value).toBe('a&b');
    });

    it('handles attributes with > inside quotes', () => {
      const tokens = tokenize('<div title="a > b"></div>');
      expect(tokens[0]).toEqual({
        type: 'StartTag',
        tagName: 'div',
        attributes: [{ name: 'title', value: 'a > b' }],
        selfClosing: false,
      });
    });

    it('normalizes tag names to lowercase', () => {
      const tokens = tokenize('<DIV></DIV>');
      expect(tokens[0]).toMatchObject({ tagName: 'div' });
      expect(tokens[1]).toMatchObject({ tagName: 'div' });
    });

    it('handles unterminated comment', () => {
      const tokens = tokenize('<!-- no end');
      expect(tokens).toEqual([{ type: 'Comment', data: ' no end' }]);
    });
  });

  describe('decodeEntities', () => {
    it('decodes named entities', () => {
      expect(decodeEntities('&amp;')).toBe('&');
      expect(decodeEntities('&lt;')).toBe('<');
      expect(decodeEntities('&gt;')).toBe('>');
      expect(decodeEntities('&quot;')).toBe('"');
      expect(decodeEntities('&apos;')).toBe("'");
    });

    it('decodes numeric entities', () => {
      expect(decodeEntities('&#65;')).toBe('A');
      expect(decodeEntities('&#97;')).toBe('a');
    });

    it('decodes hex entities', () => {
      expect(decodeEntities('&#x41;')).toBe('A');
      expect(decodeEntities('&#x61;')).toBe('a');
    });

    it('leaves unknown entities as-is', () => {
      expect(decodeEntities('&unknown;')).toBe('&unknown;');
    });

    it('handles text with no entities', () => {
      expect(decodeEntities('plain text')).toBe('plain text');
    });

    it('handles empty string', () => {
      expect(decodeEntities('')).toBe('');
    });
  });
});

// ════════════════════════════════════════════════════════════════════
// HTMLParser
// ════════════════════════════════════════════════════════════════════

describe('HTMLParser', () => {
  describe('parseHTML', () => {
    it('parses plain text into a text node', () => {
      const doc = createDoc();
      const nodes = parseHTML('hello', doc);
      expect(nodes).toHaveLength(1);
      expect(nodes[0].nodeType).toBe(Node.TEXT_NODE);
      expect(nodes[0].textContent).toBe('hello');
    });

    it('parses a simple element', () => {
      const doc = createDoc();
      const nodes = parseHTML('<div></div>', doc);
      expect(nodes).toHaveLength(1);
      expect(nodes[0].nodeType).toBe(Node.ELEMENT_NODE);
      expect((nodes[0] as Element).tagName).toBe('DIV');
    });

    it('parses nested elements', () => {
      const doc = createDoc();
      const nodes = parseHTML('<div><span>hello</span></div>', doc);
      expect(nodes).toHaveLength(1);
      const div = nodes[0] as Element;
      expect(div.tagName).toBe('DIV');
      expect(div._children).toHaveLength(1);
      const span = div._children[0] as Element;
      expect(span.tagName).toBe('SPAN');
      expect(span._children).toHaveLength(1);
      expect(span._children[0].textContent).toBe('hello');
    });

    it('parses void elements', () => {
      const doc = createDoc();
      const nodes = parseHTML('<br><hr><img src="x.png">', doc);
      expect(nodes).toHaveLength(3);
      expect((nodes[0] as Element).tagName).toBe('BR');
      expect((nodes[1] as Element).tagName).toBe('HR');
      expect((nodes[2] as Element).tagName).toBe('IMG');
      expect((nodes[2] as Element).getAttribute('src')).toBe('x.png');
      // Void elements should have no children
      nodes.forEach(n => expect(n._children).toHaveLength(0));
    });

    it('parses comments', () => {
      const doc = createDoc();
      const nodes = parseHTML('<!-- comment -->', doc);
      expect(nodes).toHaveLength(1);
      expect(nodes[0].nodeType).toBe(Node.COMMENT_NODE);
      expect(nodes[0]._textData).toBe(' comment ');
    });

    it('parses mixed content', () => {
      const doc = createDoc();
      const nodes = parseHTML('before<span>middle</span>after', doc);
      expect(nodes).toHaveLength(3);
      expect(nodes[0].nodeType).toBe(Node.TEXT_NODE);
      expect(nodes[0].textContent).toBe('before');
      expect(nodes[1].nodeType).toBe(Node.ELEMENT_NODE);
      expect((nodes[1] as Element).tagName).toBe('SPAN');
      expect(nodes[2].nodeType).toBe(Node.TEXT_NODE);
      expect(nodes[2].textContent).toBe('after');
    });

    it('parses attributes', () => {
      const doc = createDoc();
      const nodes = parseHTML('<a href="/page" class="link">click</a>', doc);
      const a = nodes[0] as Element;
      expect(a.getAttribute('href')).toBe('/page');
      expect(a.getAttribute('class')).toBe('link');
      expect(a.textContent).toBe('click');
    });

    it('parses a deeply nested list', () => {
      const doc = createDoc();
      const nodes = parseHTML('<ul><li>one</li><li>two</li></ul>', doc);
      expect(nodes).toHaveLength(1);
      const ul = nodes[0] as Element;
      expect(ul.tagName).toBe('UL');
      expect(ul._children).toHaveLength(2);
      expect((ul._children[0] as Element).tagName).toBe('LI');
      expect(ul._children[0].textContent).toBe('one');
      expect((ul._children[1] as Element).tagName).toBe('LI');
      expect(ul._children[1].textContent).toBe('two');
    });

    it('handles self-closing syntax on non-void elements', () => {
      const doc = createDoc();
      // Per HTML spec: self-closing on non-void is ignored (treated as open tag)
      const nodes = parseHTML('<div/>', doc);
      expect(nodes).toHaveLength(1);
      expect((nodes[0] as Element).tagName).toBe('DIV');
    });

    it('sets ownerDocument on created nodes', () => {
      const doc = createDoc();
      const nodes = parseHTML('<div>text</div>', doc);
      expect(nodes[0].ownerDocument).toBe(doc);
    });

    it('handles empty string', () => {
      const doc = createDoc();
      const nodes = parseHTML('', doc);
      expect(nodes).toHaveLength(0);
    });

    it('handles comment followed by element', () => {
      const doc = createDoc();
      const nodes = parseHTML('<!-- comment --><div>hi</div>', doc);
      expect(nodes).toHaveLength(2);
      expect(nodes[0].nodeType).toBe(Node.COMMENT_NODE);
      expect(nodes[1].nodeType).toBe(Node.ELEMENT_NODE);
    });

    it('decodes entities in parsed text', () => {
      const doc = createDoc();
      const nodes = parseHTML('&amp; &lt; &gt; &quot; &#39;', doc);
      expect(nodes[0].textContent).toBe('& < > " \'');
    });
  });

  describe('isVoidElement', () => {
    it('identifies void elements', () => {
      const voids = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'];
      for (const tag of voids) {
        expect(isVoidElement(tag)).toBe(true);
      }
    });

    it('rejects non-void elements', () => {
      expect(isVoidElement('div')).toBe(false);
      expect(isVoidElement('span')).toBe(false);
      expect(isVoidElement('p')).toBe(false);
    });
  });
});

// ════════════════════════════════════════════════════════════════════
// HTMLSerializer
// ════════════════════════════════════════════════════════════════════

describe('HTMLSerializer', () => {
  describe('serializeHTML', () => {
    it('serializes a text node with entity escaping', () => {
      const doc = createDoc();
      const text = doc.createTextNode('< > &');
      expect(serializeHTML(text)).toBe('&lt; &gt; &amp;');
    });

    it('serializes a comment node', () => {
      const doc = createDoc();
      const comment = doc.createComment(' hello ');
      expect(serializeHTML(comment)).toBe('<!-- hello -->');
    });

    it('serializes an empty element', () => {
      const el = createEl('div');
      expect(serializeHTML(el)).toBe('<div></div>');
    });

    it('serializes a void element without closing tag', () => {
      const el = createEl('br');
      expect(serializeHTML(el)).toBe('<br>');
    });

    it('serializes void element with attributes', () => {
      const el = createEl('img');
      el.setAttribute('src', 'test.png');
      el.setAttribute('alt', 'a "test"');
      expect(serializeHTML(el)).toBe('<img src="test.png" alt="a &quot;test&quot;">');
    });

    it('serializes element with children', () => {
      const doc = createDoc();
      const div = doc.createElement('div');
      const span = doc.createElement('span');
      span.appendChild(doc.createTextNode('hello'));
      div.appendChild(span);
      expect(serializeHTML(div)).toBe('<div><span>hello</span></div>');
    });

    it('serializes element with attributes', () => {
      const doc = createDoc();
      const el = doc.createElement('a');
      el.setAttribute('href', '/page');
      el.setAttribute('class', 'link');
      el.appendChild(doc.createTextNode('click'));
      expect(serializeHTML(el)).toBe('<a href="/page" class="link">click</a>');
    });

    it('serializes boolean attributes without value', () => {
      const el = createEl('input');
      el.setAttribute('disabled', '');
      expect(serializeHTML(el)).toBe('<input disabled>');
    });

    it('serializes nested structure', () => {
      const doc = createDoc();
      const ul = doc.createElement('ul');
      const li1 = doc.createElement('li');
      li1.appendChild(doc.createTextNode('one'));
      const li2 = doc.createElement('li');
      li2.appendChild(doc.createTextNode('two'));
      ul.appendChild(li1);
      ul.appendChild(li2);
      expect(serializeHTML(ul)).toBe('<ul><li>one</li><li>two</li></ul>');
    });
  });
});

// ════════════════════════════════════════════════════════════════════
// innerHTML
// ════════════════════════════════════════════════════════════════════

describe('Element.innerHTML', () => {
  describe('setter', () => {
    it('creates correct nested DOM tree', () => {
      const el = createEl('div');
      el.innerHTML = '<div><span>hello</span></div>';
      expect(el._children).toHaveLength(1);
      const inner = el._children[0] as Element;
      expect(inner.tagName).toBe('DIV');
      expect(inner._children).toHaveLength(1);
      const span = inner._children[0] as Element;
      expect(span.tagName).toBe('SPAN');
      expect(span.textContent).toBe('hello');
    });

    it('sets proper parent/child/sibling relationships', () => {
      const el = createEl('div');
      el.innerHTML = '<span>a</span><span>b</span>';
      expect(el._children).toHaveLength(2);
      const first = el._children[0];
      const second = el._children[1];
      expect(first.parentNode).toBe(el);
      expect(second.parentNode).toBe(el);
      expect(first.nextSibling).toBe(second);
      expect(second.previousSibling).toBe(first);
      expect(first.previousSibling).toBeNull();
      expect(second.nextSibling).toBeNull();
    });

    it('creates void elements without children', () => {
      const el = createEl('div');
      el.innerHTML = '<br><hr><img src="x.png">';
      expect(el._children).toHaveLength(3);
      el._children.forEach(child => {
        expect(child._children).toHaveLength(0);
      });
    });

    it('preserves attributes', () => {
      const el = createEl('div');
      el.innerHTML = '<a href="/page" class="link">click</a>';
      const a = el._children[0] as Element;
      expect(a.getAttribute('href')).toBe('/page');
      expect(a.getAttribute('class')).toBe('link');
    });

    it('creates a single Text node for plain text', () => {
      const el = createEl('div');
      el.innerHTML = 'just text';
      expect(el._children).toHaveLength(1);
      expect(el._children[0].nodeType).toBe(Node.TEXT_NODE);
      expect(el._children[0].textContent).toBe('just text');
    });

    it('creates mixed Text/Element/Text children', () => {
      const el = createEl('div');
      el.innerHTML = 'before<span>middle</span>after';
      expect(el._children).toHaveLength(3);
      expect(el._children[0].nodeType).toBe(Node.TEXT_NODE);
      expect(el._children[0].textContent).toBe('before');
      expect(el._children[1].nodeType).toBe(Node.ELEMENT_NODE);
      expect((el._children[1] as Element).tagName).toBe('SPAN');
      expect(el._children[2].nodeType).toBe(Node.TEXT_NODE);
      expect(el._children[2].textContent).toBe('after');
    });

    it('creates Comment followed by Element', () => {
      const el = createEl('div');
      el.innerHTML = '<!-- comment --><div>hi</div>';
      expect(el._children).toHaveLength(2);
      expect(el._children[0].nodeType).toBe(Node.COMMENT_NODE);
      expect(el._children[1].nodeType).toBe(Node.ELEMENT_NODE);
    });

    it('decodes entities in text content', () => {
      const el = createEl('div');
      el.innerHTML = '&amp; &lt; &gt; &quot; &#39;';
      expect(el.textContent).toBe('& < > " \'');
    });

    it('removes all children when set to empty string', () => {
      const el = createEl('div');
      el.innerHTML = '<span>a</span><span>b</span>';
      expect(el._children).toHaveLength(2);
      el.innerHTML = '';
      expect(el._children).toHaveLength(0);
    });

    it('replaces existing children', () => {
      const el = createEl('div');
      el.innerHTML = '<span>old</span>';
      expect(el._children).toHaveLength(1);
      expect(el.textContent).toBe('old');
      el.innerHTML = '<p>new</p>';
      expect(el._children).toHaveLength(1);
      expect((el._children[0] as Element).tagName).toBe('P');
      expect(el.textContent).toBe('new');
    });

    it('handles nested structures', () => {
      const el = createEl('div');
      el.innerHTML = '<ul><li>one</li><li>two</li></ul>';
      const ul = el._children[0] as Element;
      expect(ul.tagName).toBe('UL');
      expect(ul._children).toHaveLength(2);
      expect(ul._children[0].textContent).toBe('one');
      expect(ul._children[1].textContent).toBe('two');
    });

    it('handles self-closing syntax on non-void elements', () => {
      const el = createEl('div');
      el.innerHTML = '<div/>';
      // Per HTML spec, self-closing on non-void is treated as opening tag
      expect(el._children).toHaveLength(1);
      expect((el._children[0] as Element).tagName).toBe('DIV');
    });
  });

  describe('getter', () => {
    it('returns empty string for element with no children', () => {
      const el = createEl('div');
      expect(el.innerHTML).toBe('');
    });

    it('returns correct HTML from manually built tree', () => {
      const doc = createDoc();
      const div = doc.createElement('div');
      const span = doc.createElement('span');
      span.appendChild(doc.createTextNode('hello'));
      div.appendChild(span);
      expect(div.innerHTML).toBe('<span>hello</span>');
    });

    it('encodes entities in text content', () => {
      const doc = createDoc();
      const div = doc.createElement('div');
      div.appendChild(doc.createTextNode('< > &'));
      expect(div.innerHTML).toBe('&lt; &gt; &amp;');
    });

    it('serializes void elements without closing tag', () => {
      const doc = createDoc();
      const div = doc.createElement('div');
      div.appendChild(doc.createElement('br'));
      div.appendChild(doc.createElement('hr'));
      expect(div.innerHTML).toBe('<br><hr>');
    });

    it('serializes attributes', () => {
      const doc = createDoc();
      const div = doc.createElement('div');
      const a = doc.createElement('a');
      a.setAttribute('href', '/page');
      div.appendChild(a);
      expect(div.innerHTML).toBe('<a href="/page"></a>');
    });

    it('serializes comments', () => {
      const doc = createDoc();
      const div = doc.createElement('div');
      div.appendChild(doc.createComment(' test '));
      expect(div.innerHTML).toBe('<!-- test -->');
    });
  });

  describe('round-trip', () => {
    const cases = [
      '<div><span>hello</span></div>',
      '<a href="/page" class="link">click</a>',
      '<ul><li>one</li><li>two</li></ul>',
      '<br><hr>',
      '<img src="test.png">',
      '<!-- comment --><div>hi</div>',
      'plain text',
      'before<span>middle</span>after',
      '<div><p>paragraph</p><br><p>another</p></div>',
    ];

    for (const html of cases) {
      it(`round-trips: ${html}`, () => {
        const el = createEl('div');
        el.innerHTML = html;
        expect(el.innerHTML).toBe(html);
      });
    }
  });
});

// ════════════════════════════════════════════════════════════════════
// outerHTML
// ════════════════════════════════════════════════════════════════════

describe('Element.outerHTML', () => {
  describe('getter', () => {
    it('returns element tag wrapping innerHTML', () => {
      const doc = createDoc();
      const div = doc.createElement('div');
      div.appendChild(doc.createTextNode('hello'));
      expect(div.outerHTML).toBe('<div>hello</div>');
    });

    it('includes attributes', () => {
      const doc = createDoc();
      const div = doc.createElement('div');
      div.setAttribute('id', 'main');
      div.setAttribute('class', 'container');
      expect(div.outerHTML).toBe('<div id="main" class="container"></div>');
    });

    it('works for void elements', () => {
      const el = createEl('br');
      expect(el.outerHTML).toBe('<br>');
    });

    it('includes nested children', () => {
      const doc = createDoc();
      const div = doc.createElement('div');
      const span = doc.createElement('span');
      span.appendChild(doc.createTextNode('hi'));
      div.appendChild(span);
      expect(div.outerHTML).toBe('<div><span>hi</span></div>');
    });
  });

  describe('setter', () => {
    it('replaces element in its parent with parsed content', () => {
      const doc = createDoc();
      const parent = doc.createElement('div');
      const child = doc.createElement('span');
      child.appendChild(doc.createTextNode('old'));
      parent.appendChild(child);

      child.outerHTML = '<p>new</p>';
      expect(parent._children).toHaveLength(1);
      expect((parent._children[0] as Element).tagName).toBe('P');
      expect(parent._children[0].textContent).toBe('new');
    });

    it('can replace with multiple nodes', () => {
      const doc = createDoc();
      const parent = doc.createElement('div');
      const child = doc.createElement('span');
      parent.appendChild(child);

      child.outerHTML = '<b>a</b><i>b</i>';
      expect(parent._children).toHaveLength(2);
      expect((parent._children[0] as Element).tagName).toBe('B');
      expect((parent._children[1] as Element).tagName).toBe('I');
    });

    it('throws when element has no parent', () => {
      const el = createEl('div');
      expect(() => {
        el.outerHTML = '<p>test</p>';
      }).toThrow();
    });

    it('preserves siblings when replacing', () => {
      const doc = createDoc();
      const parent = doc.createElement('div');
      const first = doc.createElement('span');
      first.appendChild(doc.createTextNode('first'));
      const middle = doc.createElement('span');
      middle.appendChild(doc.createTextNode('middle'));
      const last = doc.createElement('span');
      last.appendChild(doc.createTextNode('last'));
      parent.appendChild(first);
      parent.appendChild(middle);
      parent.appendChild(last);

      middle.outerHTML = '<b>replaced</b>';
      expect(parent._children).toHaveLength(3);
      expect(parent._children[0].textContent).toBe('first');
      expect((parent._children[1] as Element).tagName).toBe('B');
      expect(parent._children[1].textContent).toBe('replaced');
      expect(parent._children[2].textContent).toBe('last');
    });
  });
});

// ════════════════════════════════════════════════════════════════════
// Integration: parseHTML + serializeHTML via exports
// ════════════════════════════════════════════════════════════════════

describe('parseHTML / serializeHTML exports', () => {
  it('parseHTML returns nodes from an HTML string', () => {
    const doc = createDoc();
    const nodes = parseHTML('<div>test</div>', doc);
    expect(nodes).toHaveLength(1);
    expect((nodes[0] as Element).tagName).toBe('DIV');
  });

  it('serializeHTML converts a node back to HTML', () => {
    const doc = createDoc();
    const div = doc.createElement('div');
    div.appendChild(doc.createTextNode('test'));
    expect(serializeHTML(div)).toBe('<div>test</div>');
  });
});
