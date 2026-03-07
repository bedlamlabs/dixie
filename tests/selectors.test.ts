import { describe, it, expect } from 'vitest';
import { Document, DocumentFragment, Element } from '../src';
import { parseSelector } from '../src/selectors/SelectorParser';

// ── Helper ────────────────────────────────────────────────────────────

function createDoc(html: string): Document {
  const doc = new Document();
  doc.body.innerHTML = html;
  return doc;
}

// ════════════════════════════════════════════════════════════════════════
// SelectorParser unit tests
// ════════════════════════════════════════════════════════════════════════

describe('SelectorParser', () => {
  it('parses a type selector', () => {
    const ast = parseSelector('div');
    expect(ast.selectors).toHaveLength(1);
    expect(ast.selectors[0].head.selectors[0]).toEqual({ type: 'type', name: 'div' });
  });

  it('parses a class selector', () => {
    const ast = parseSelector('.foo');
    expect(ast.selectors[0].head.selectors[0]).toEqual({ type: 'class', name: 'foo' });
  });

  it('parses an ID selector', () => {
    const ast = parseSelector('#bar');
    expect(ast.selectors[0].head.selectors[0]).toEqual({ type: 'id', name: 'bar' });
  });

  it('parses the universal selector', () => {
    const ast = parseSelector('*');
    expect(ast.selectors[0].head.selectors[0]).toEqual({ type: 'universal' });
  });

  it('parses attribute presence', () => {
    const ast = parseSelector('[disabled]');
    expect(ast.selectors[0].head.selectors[0]).toEqual({
      type: 'attribute', name: 'disabled', operator: null, value: null,
    });
  });

  it('parses attribute value with quotes', () => {
    const ast = parseSelector('[type="text"]');
    expect(ast.selectors[0].head.selectors[0]).toEqual({
      type: 'attribute', name: 'type', operator: '=', value: 'text',
    });
  });

  it('parses compound selectors', () => {
    const ast = parseSelector('div.foo#bar');
    const simple = ast.selectors[0].head.selectors;
    expect(simple).toHaveLength(3);
    expect(simple[0]).toEqual({ type: 'type', name: 'div' });
    expect(simple[1]).toEqual({ type: 'class', name: 'foo' });
    expect(simple[2]).toEqual({ type: 'id', name: 'bar' });
  });

  it('parses selector lists (comma-separated)', () => {
    const ast = parseSelector('h1, h2, h3');
    expect(ast.selectors).toHaveLength(3);
  });

  it('parses descendant combinator', () => {
    const ast = parseSelector('div span');
    expect(ast.selectors[0].tail).toHaveLength(1);
    expect(ast.selectors[0].tail[0].combinator).toBe('descendant');
  });

  it('parses child combinator', () => {
    const ast = parseSelector('ul > li');
    expect(ast.selectors[0].tail).toHaveLength(1);
    expect(ast.selectors[0].tail[0].combinator).toBe('child');
  });

  it('parses attribute operators: ^=, $=, *=, ~=, |=', () => {
    for (const [sel, op] of [
      ['[class^="btn"]', '^='],
      ['[href$=".pdf"]', '$='],
      ['[class*="item"]', '*='],
      ['[class~="active"]', '~='],
      ['[lang|="en"]', '|='],
    ] as const) {
      const ast = parseSelector(sel);
      const s = ast.selectors[0].head.selectors[0];
      expect(s).toHaveProperty('operator', op);
    }
  });

  it('throws on empty selector', () => {
    expect(() => parseSelector('')).toThrow();
  });

  it('throws on trailing comma', () => {
    expect(() => parseSelector('div,')).toThrow();
  });

  it('parses single-quoted attribute values', () => {
    const ast = parseSelector("[type='text']");
    const s = ast.selectors[0].head.selectors[0] as any;
    expect(s.value).toBe('text');
  });

  it('parses unquoted attribute values', () => {
    const ast = parseSelector('[type=text]');
    const s = ast.selectors[0].head.selectors[0] as any;
    expect(s.value).toBe('text');
  });

  it('parses chained combinators: div > ul span', () => {
    const ast = parseSelector('div > ul span');
    const complex = ast.selectors[0];
    expect(complex.tail).toHaveLength(2);
    expect(complex.tail[0].combinator).toBe('child');
    expect(complex.tail[1].combinator).toBe('descendant');
  });
});

// ════════════════════════════════════════════════════════════════════════
// Document.querySelector / querySelectorAll
// ════════════════════════════════════════════════════════════════════════

describe('Document.querySelector', () => {
  it('finds element by type selector', () => {
    const doc = createDoc('<div><span>hello</span></div>');
    const el = doc.querySelector('span');
    expect(el).not.toBeNull();
    expect(el!.tagName).toBe('SPAN');
    expect(el!.textContent).toBe('hello');
  });

  it('finds element by class selector', () => {
    const doc = createDoc('<p class="active">text</p><p>other</p>');
    const el = doc.querySelector('.active');
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe('text');
  });

  it('finds element by ID selector', () => {
    const doc = createDoc('<div id="main">content</div>');
    const el = doc.querySelector('#main');
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe('content');
  });

  it('returns null when no match', () => {
    const doc = createDoc('<div></div>');
    expect(doc.querySelector('.nonexistent')).toBeNull();
  });

  it('finds first match in document order', () => {
    const doc = createDoc('<div class="a">1</div><div class="a">2</div>');
    const el = doc.querySelector('.a');
    expect(el!.textContent).toBe('1');
  });
});

describe('Document.querySelectorAll', () => {
  it('finds all elements by type', () => {
    const doc = createDoc('<div>1</div><div>2</div><div>3</div>');
    const list = doc.querySelectorAll('div');
    expect(list.length).toBe(3);
  });

  it('finds all elements with class', () => {
    const doc = createDoc('<p class="active">1</p><p>2</p><p class="active">3</p>');
    const list = doc.querySelectorAll('.active');
    expect(list.length).toBe(2);
  });

  it('universal selector finds all elements', () => {
    const doc = createDoc('<div><span>x</span></div>');
    const all = doc.querySelectorAll('*');
    // html, head, body, div, span
    expect(all.length).toBe(5);
  });

  it('returns a static NodeList (not live)', () => {
    const doc = createDoc('<div>1</div>');
    const list = doc.querySelectorAll('div');
    expect(list.length).toBe(1);
    doc.body.innerHTML = '<div>1</div><div>2</div>';
    // Static — still shows 1
    expect(list.length).toBe(1);
  });

  it('selector list (comma) finds multiple types', () => {
    const doc = createDoc('<h1>a</h1><h2>b</h2><h3>c</h3><p>d</p>');
    const list = doc.querySelectorAll('h1, h2, h3');
    expect(list.length).toBe(3);
  });
});

// ════════════════════════════════════════════════════════════════════════
// Attribute selectors
// ════════════════════════════════════════════════════════════════════════

describe('Attribute selectors', () => {
  it('presence: [disabled]', () => {
    const doc = createDoc('<input disabled><input>');
    const el = doc.querySelector('[disabled]');
    expect(el).not.toBeNull();
    expect(el!.tagName).toBe('INPUT');
  });

  it('exact value: [type="text"]', () => {
    const doc = createDoc('<input type="text"><input type="password">');
    const el = doc.querySelector('[type="text"]');
    expect(el).not.toBeNull();
    expect(el!.getAttribute('type')).toBe('text');
  });

  it('prefix: [class^="btn"]', () => {
    const doc = createDoc('<div class="btn-primary">a</div><div class="link">b</div>');
    const el = doc.querySelector('[class^="btn"]');
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe('a');
  });

  it('suffix: [href$=".pdf"]', () => {
    const doc = createDoc('<a href="doc.pdf">pdf</a><a href="doc.html">html</a>');
    const el = doc.querySelector('[href$=".pdf"]');
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe('pdf');
  });

  it('contains: [class*="item"]', () => {
    const doc = createDoc('<div class="menu-item-active">x</div><div class="header">y</div>');
    const el = doc.querySelector('[class*="item"]');
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe('x');
  });

  it('whitespace-separated: [class~="active"]', () => {
    const doc = createDoc('<div class="foo active bar">match</div><div class="inactive">no</div>');
    const el = doc.querySelector('[class~="active"]');
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe('match');
  });

  it('dash-separated: [lang|="en"]', () => {
    const doc = createDoc('<p lang="en-US">us</p><p lang="fr">fr</p>');
    const el = doc.querySelector('[lang|="en"]');
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe('us');
  });

  it('dash-separated matches exact value too', () => {
    const doc = createDoc('<p lang="en">exact</p>');
    const el = doc.querySelector('[lang|="en"]');
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe('exact');
  });

  it('no match when attribute absent', () => {
    const doc = createDoc('<div>no attr</div>');
    expect(doc.querySelector('[data-x]')).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════════════
// Compound selectors
// ════════════════════════════════════════════════════════════════════════

describe('Compound selectors', () => {
  it('div.active matches only div with class active', () => {
    const doc = createDoc('<div class="active">1</div><span class="active">2</span>');
    const el = doc.querySelector('div.active');
    expect(el).not.toBeNull();
    expect(el!.tagName).toBe('DIV');
  });

  it('div.foo#bar requires all parts to match', () => {
    const doc = createDoc('<div class="foo" id="bar">match</div><div class="foo">no</div>');
    const el = doc.querySelector('div.foo#bar');
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe('match');
  });

  it('compound with attribute: input[type="text"]', () => {
    const doc = createDoc('<input type="text"><div type="text"></div>');
    const el = doc.querySelector('input[type="text"]');
    expect(el).not.toBeNull();
    expect(el!.tagName).toBe('INPUT');
  });
});

// ════════════════════════════════════════════════════════════════════════
// Descendant combinator
// ════════════════════════════════════════════════════════════════════════

describe('Descendant combinator', () => {
  it('div span finds span inside div', () => {
    const doc = createDoc('<div><span>inside</span></div><span>outside</span>');
    const list = doc.querySelectorAll('div span');
    expect(list.length).toBe(1);
    expect(list.item(0)!.textContent).toBe('inside');
  });

  it('finds deeply nested descendants', () => {
    const doc = createDoc('<div><p><span>deep</span></p></div>');
    const el = doc.querySelector('div span');
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe('deep');
  });

  it('does not match elements outside ancestor', () => {
    const doc = createDoc('<p><span>in-p</span></p><div><span>in-div</span></div>');
    const list = doc.querySelectorAll('div span');
    expect(list.length).toBe(1);
    expect(list.item(0)!.textContent).toBe('in-div');
  });
});

// ════════════════════════════════════════════════════════════════════════
// Child combinator
// ════════════════════════════════════════════════════════════════════════

describe('Child combinator', () => {
  it('ul > li finds direct children only', () => {
    const doc = createDoc('<ul><li>1</li><li>2</li></ul>');
    const list = doc.querySelectorAll('ul > li');
    expect(list.length).toBe(2);
  });

  it('does not match non-direct descendants', () => {
    const doc = createDoc('<ul><div><li>nested</li></div></ul>');
    const list = doc.querySelectorAll('ul > li');
    expect(list.length).toBe(0);
  });

  it('chained: div > ul > li', () => {
    const doc = createDoc('<div><ul><li>yes</li></ul></div><ul><li>no</li></ul>');
    const list = doc.querySelectorAll('div > ul > li');
    expect(list.length).toBe(1);
    expect(list.item(0)!.textContent).toBe('yes');
  });
});

// ════════════════════════════════════════════════════════════════════════
// Mixed combinators
// ════════════════════════════════════════════════════════════════════════

describe('Mixed combinators', () => {
  it('div > ul span (child then descendant)', () => {
    const doc = createDoc('<div><ul><li><span>match</span></li></ul></div>');
    const el = doc.querySelector('div > ul span');
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe('match');
  });

  it('div p > span (descendant then child)', () => {
    const doc = createDoc('<div><p><span>yes</span></p></div>');
    const el = doc.querySelector('div p > span');
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe('yes');
  });

  it('descendant then child: no false positive', () => {
    const doc = createDoc('<div><p><em><span>no</span></em></p></div>');
    const el = doc.querySelector('div p > span');
    // span's parent is em, not p — should not match
    expect(el).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════════════
// Element.matches()
// ════════════════════════════════════════════════════════════════════════

describe('Element.matches', () => {
  it('returns true for matching type selector', () => {
    const doc = createDoc('<div class="foo">x</div>');
    const el = doc.querySelector('div')!;
    expect(el.matches('div')).toBe(true);
  });

  it('returns true for matching class selector', () => {
    const doc = createDoc('<div class="foo">x</div>');
    const el = doc.querySelector('div')!;
    expect(el.matches('.foo')).toBe(true);
  });

  it('returns false for non-matching selector', () => {
    const doc = createDoc('<div>x</div>');
    const el = doc.querySelector('div')!;
    expect(el.matches('.bar')).toBe(false);
  });

  it('works with compound selector', () => {
    const doc = createDoc('<div class="foo" id="bar">x</div>');
    const el = doc.querySelector('div')!;
    expect(el.matches('div.foo#bar')).toBe(true);
    expect(el.matches('div.foo#baz')).toBe(false);
  });

  it('works with selector list', () => {
    const doc = createDoc('<span>x</span>');
    const el = doc.querySelector('span')!;
    expect(el.matches('div, span')).toBe(true);
    expect(el.matches('div, p')).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════
// Element.closest()
// ════════════════════════════════════════════════════════════════════════

describe('Element.closest', () => {
  it('returns self if self matches', () => {
    const doc = createDoc('<div class="container"><span>x</span></div>');
    const container = doc.querySelector('.container')!;
    expect(container.closest('.container')).toBe(container);
  });

  it('walks up to find matching ancestor', () => {
    const doc = createDoc('<div class="container"><p><span>x</span></p></div>');
    const span = doc.querySelector('span')!;
    const result = span.closest('.container');
    expect(result).not.toBeNull();
    expect(result!.tagName).toBe('DIV');
    expect(result!.className).toBe('container');
  });

  it('returns null when no ancestor matches', () => {
    const doc = createDoc('<div><span>x</span></div>');
    const span = doc.querySelector('span')!;
    expect(span.closest('.nonexistent')).toBeNull();
  });

  it('stops at document boundary (returns null for non-matching)', () => {
    const doc = createDoc('<span>x</span>');
    const span = doc.querySelector('span')!;
    expect(span.closest('.does-not-exist')).toBeNull();
  });

  it('matches with compound selector', () => {
    const doc = createDoc('<div class="a" id="b"><span>x</span></div>');
    const span = doc.querySelector('span')!;
    expect(span.closest('div.a#b')).not.toBeNull();
    expect(span.closest('div.a#c')).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════════════
// Element.querySelector (scoped)
// ════════════════════════════════════════════════════════════════════════

describe('Element.querySelector (scoped)', () => {
  it('finds only within subtree', () => {
    const doc = createDoc(
      '<div id="a"><span class="target">A</span></div>' +
      '<div id="b"><span class="target">B</span></div>',
    );
    const divB = doc.querySelector('#b')!;
    const result = divB.querySelector('.target');
    expect(result).not.toBeNull();
    expect(result!.textContent).toBe('B');
  });

  it('does not find elements outside subtree', () => {
    const doc = createDoc(
      '<div id="outer"><span>outer</span></div>' +
      '<div id="inner"></div>',
    );
    const inner = doc.querySelector('#inner')!;
    expect(inner.querySelector('span')).toBeNull();
  });

  it('querySelectorAll is scoped', () => {
    const doc = createDoc(
      '<div id="a"><p>1</p><p>2</p></div>' +
      '<div id="b"><p>3</p></div>',
    );
    const divA = doc.querySelector('#a')!;
    const list = divA.querySelectorAll('p');
    expect(list.length).toBe(2);
  });
});

// ════════════════════════════════════════════════════════════════════════
// DocumentFragment.querySelector
// ════════════════════════════════════════════════════════════════════════

describe('DocumentFragment.querySelector', () => {
  it('finds elements within fragment', () => {
    const doc = new Document();
    const frag = doc.createDocumentFragment();
    const div = doc.createElement('div');
    div.className = 'test';
    div.textContent = 'hello';
    frag.appendChild(div);

    const result = frag.querySelector('.test');
    expect(result).not.toBeNull();
    expect(result!.textContent).toBe('hello');
  });

  it('querySelectorAll finds all matches in fragment', () => {
    const doc = new Document();
    const frag = doc.createDocumentFragment();
    for (let i = 0; i < 3; i++) {
      const p = doc.createElement('p');
      p.className = 'item';
      frag.appendChild(p);
    }
    const list = frag.querySelectorAll('.item');
    expect(list.length).toBe(3);
  });

  it('returns null when nothing matches', () => {
    const doc = new Document();
    const frag = doc.createDocumentFragment();
    frag.appendChild(doc.createElement('div'));
    expect(frag.querySelector('.nope')).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════════════
// Case insensitivity
// ════════════════════════════════════════════════════════════════════════

describe('Case insensitivity', () => {
  it('type selectors are case-insensitive', () => {
    const doc = createDoc('<DIV>hello</DIV>');
    expect(doc.querySelector('div')).not.toBeNull();
    expect(doc.querySelector('DIV')).not.toBeNull();
    expect(doc.querySelector('Div')).not.toBeNull();
  });

  it('class selectors are case-sensitive', () => {
    const doc = createDoc('<div class="Foo">x</div>');
    expect(doc.querySelector('.Foo')).not.toBeNull();
    expect(doc.querySelector('.foo')).toBeNull();
  });

  it('ID selectors are case-sensitive', () => {
    const doc = createDoc('<div id="Main">x</div>');
    expect(doc.querySelector('#Main')).not.toBeNull();
    expect(doc.querySelector('#main')).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════════════
// Edge cases
// ════════════════════════════════════════════════════════════════════════

describe('Edge cases', () => {
  it('querySelectorAll on empty document body returns empty list', () => {
    const doc = new Document();
    const list = doc.querySelectorAll('.nothing');
    expect(list.length).toBe(0);
  });

  it('querySelector throws on invalid selector', () => {
    const doc = new Document();
    expect(() => doc.querySelector('')).toThrow();
  });

  it('deeply nested descendant combinator works', () => {
    const doc = createDoc('<div><a><b><c><d><span>deep</span></d></c></b></a></div>');
    const el = doc.querySelector('div span');
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe('deep');
  });

  it('multiple classes on same element', () => {
    const doc = createDoc('<div class="a b c">x</div>');
    expect(doc.querySelector('.a')).not.toBeNull();
    expect(doc.querySelector('.b')).not.toBeNull();
    expect(doc.querySelector('.c')).not.toBeNull();
    expect(doc.querySelector('.a.b.c')).not.toBeNull();
    expect(doc.querySelector('.a.d')).toBeNull();
  });

  it('attribute with empty value', () => {
    const doc = createDoc('<input value="">');
    const el = doc.querySelector('[value=""]');
    expect(el).not.toBeNull();
  });

  it('attribute value with special chars in quotes', () => {
    const doc = createDoc('<a href="/path/to/file.pdf">link</a>');
    const el = doc.querySelector('[href$=".pdf"]');
    expect(el).not.toBeNull();
  });

  it('universal in compound: *.foo', () => {
    const doc = createDoc('<div class="foo">x</div>');
    const el = doc.querySelector('*.foo');
    expect(el).not.toBeNull();
    expect(el!.tagName).toBe('DIV');
  });

  it('child combinator with no match returns empty list', () => {
    const doc = createDoc('<div><span>x</span></div>');
    const list = doc.querySelectorAll('div > p');
    expect(list.length).toBe(0);
  });

  it('selector with whitespace around child combinator', () => {
    const doc = createDoc('<ul><li>x</li></ul>');
    const list = doc.querySelectorAll('ul  >  li');
    expect(list.length).toBe(1);
  });

  it('comma-separated with different types', () => {
    const doc = createDoc('<div>1</div><span>2</span><p>3</p>');
    const list = doc.querySelectorAll('div, p');
    expect(list.length).toBe(2);
  });

  it('matches the head and body elements', () => {
    const doc = new Document();
    expect(doc.querySelector('head')).toBe(doc.head);
    expect(doc.querySelector('body')).toBe(doc.body);
    expect(doc.querySelector('html')).toBe(doc.documentElement);
  });
});
