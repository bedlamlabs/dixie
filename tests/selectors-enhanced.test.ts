import { describe, it, expect } from 'vitest';
import { Document } from '../src';
import { parseSelector } from '../src/selectors/SelectorParser';

// ── Helper ────────────────────────────────────────────────────────────

function createDoc(html: string): Document {
  const doc = new Document();
  doc.body.innerHTML = html;
  return doc;
}

// ════════════════════════════════════════════════════════════════════════
// Adjacent Sibling Combinator (+)
// ════════════════════════════════════════════════════════════════════════

describe('Adjacent sibling combinator (+)', () => {
  it('h1 + p matches p immediately following h1', () => {
    const doc = createDoc('<h1>Title</h1><p>First para</p><p>Second para</p>');
    const el = doc.querySelector('h1 + p');
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe('First para');
  });

  it('h1 + p does NOT match p that is not immediately after h1', () => {
    const doc = createDoc('<h1>Title</h1><div>gap</div><p>After gap</p>');
    const el = doc.querySelector('h1 + p');
    expect(el).toBeNull();
  });

  it('matches only the immediately adjacent sibling, not later ones', () => {
    const doc = createDoc('<h1>T</h1><p>1</p><p>2</p>');
    const list = doc.querySelectorAll('h1 + p');
    expect(list.length).toBe(1);
    expect(list.item(0)!.textContent).toBe('1');
  });

  it('skips text nodes when finding adjacent sibling', () => {
    // innerHTML parser may create text nodes between elements
    const doc = createDoc('<div><span>a</span><em>b</em></div>');
    const el = doc.querySelector('span + em');
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe('b');
  });

  it('does not match when there is no previous sibling', () => {
    const doc = createDoc('<div><p>only child</p></div>');
    const el = doc.querySelector('h1 + p');
    expect(el).toBeNull();
  });

  it('parses adjacent sibling combinator in AST', () => {
    const ast = parseSelector('h1 + p');
    expect(ast.selectors[0].tail).toHaveLength(1);
    expect(ast.selectors[0].tail[0].combinator).toBe('adjacentSibling');
  });

  it('works with compound selectors: div.a + div.b', () => {
    const doc = createDoc('<div class="a">1</div><div class="b">2</div><div class="b">3</div>');
    const list = doc.querySelectorAll('div.a + div.b');
    expect(list.length).toBe(1);
    expect(list.item(0)!.textContent).toBe('2');
  });
});

// ════════════════════════════════════════════════════════════════════════
// General Sibling Combinator (~)
// ════════════════════════════════════════════════════════════════════════

describe('General sibling combinator (~)', () => {
  it('h1 ~ p matches any p following h1 as sibling', () => {
    const doc = createDoc('<h1>Title</h1><div>gap</div><p>First</p><p>Second</p>');
    const list = doc.querySelectorAll('h1 ~ p');
    expect(list.length).toBe(2);
  });

  it('does NOT match elements before the reference', () => {
    const doc = createDoc('<p>Before</p><h1>Title</h1>');
    const el = doc.querySelector('h1 ~ p');
    expect(el).toBeNull();
  });

  it('requires same parent', () => {
    const doc = createDoc('<div><h1>T</h1></div><div><p>Diff parent</p></div>');
    const el = doc.querySelector('h1 ~ p');
    expect(el).toBeNull();
  });

  it('matches even with elements in between', () => {
    const doc = createDoc('<h1>T</h1><span>x</span><em>y</em><p>Found</p>');
    const el = doc.querySelector('h1 ~ p');
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe('Found');
  });

  it('parses general sibling combinator in AST', () => {
    const ast = parseSelector('h1 ~ p');
    expect(ast.selectors[0].tail).toHaveLength(1);
    expect(ast.selectors[0].tail[0].combinator).toBe('generalSibling');
  });

  it('does not match when reference element does not exist', () => {
    const doc = createDoc('<div><p>no h1 sibling</p></div>');
    const el = doc.querySelector('h1 ~ p');
    expect(el).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════════════
// :first-child
// ════════════════════════════════════════════════════════════════════════

describe(':first-child', () => {
  it('matches the first element child', () => {
    const doc = createDoc('<div><p>first</p><p>second</p></div>');
    const el = doc.querySelector('p:first-child');
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe('first');
  });

  it('does not match non-first children', () => {
    const doc = createDoc('<div><span>a</span><p>b</p></div>');
    const el = doc.querySelector('p:first-child');
    expect(el).toBeNull();
  });

  it('matches the only child', () => {
    const doc = createDoc('<div><p>only</p></div>');
    const el = doc.querySelector('p:first-child');
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe('only');
  });
});

// ════════════════════════════════════════════════════════════════════════
// :last-child
// ════════════════════════════════════════════════════════════════════════

describe(':last-child', () => {
  it('matches the last element child', () => {
    const doc = createDoc('<div><p>first</p><p>last</p></div>');
    const el = doc.querySelector('p:last-child');
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe('last');
  });

  it('does not match non-last children', () => {
    const doc = createDoc('<div><p>a</p><span>b</span></div>');
    const el = doc.querySelector('p:last-child');
    expect(el).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════════════
// :nth-child()
// ════════════════════════════════════════════════════════════════════════

describe(':nth-child()', () => {
  it(':nth-child(1) matches first child', () => {
    const doc = createDoc('<ul><li>1</li><li>2</li><li>3</li></ul>');
    const el = doc.querySelector('li:nth-child(1)');
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe('1');
  });

  it(':nth-child(2) matches second child', () => {
    const doc = createDoc('<ul><li>1</li><li>2</li><li>3</li></ul>');
    const el = doc.querySelector('li:nth-child(2)');
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe('2');
  });

  it(':nth-child(odd) matches 1st, 3rd, 5th...', () => {
    const doc = createDoc('<ul><li>1</li><li>2</li><li>3</li><li>4</li><li>5</li></ul>');
    const list = doc.querySelectorAll('li:nth-child(odd)');
    expect(list.length).toBe(3);
    expect(list.item(0)!.textContent).toBe('1');
    expect(list.item(1)!.textContent).toBe('3');
    expect(list.item(2)!.textContent).toBe('5');
  });

  it(':nth-child(even) matches 2nd, 4th...', () => {
    const doc = createDoc('<ul><li>1</li><li>2</li><li>3</li><li>4</li></ul>');
    const list = doc.querySelectorAll('li:nth-child(even)');
    expect(list.length).toBe(2);
    expect(list.item(0)!.textContent).toBe('2');
    expect(list.item(1)!.textContent).toBe('4');
  });

  it(':nth-child(2n) matches even positions', () => {
    const doc = createDoc('<ul><li>1</li><li>2</li><li>3</li><li>4</li></ul>');
    const list = doc.querySelectorAll('li:nth-child(2n)');
    expect(list.length).toBe(2);
    expect(list.item(0)!.textContent).toBe('2');
    expect(list.item(1)!.textContent).toBe('4');
  });

  it(':nth-child(2n+1) matches odd positions', () => {
    const doc = createDoc('<ul><li>1</li><li>2</li><li>3</li><li>4</li></ul>');
    const list = doc.querySelectorAll('li:nth-child(2n+1)');
    expect(list.length).toBe(2);
    expect(list.item(0)!.textContent).toBe('1');
    expect(list.item(1)!.textContent).toBe('3');
  });

  it(':nth-child(3n) matches every 3rd', () => {
    const doc = createDoc('<ul><li>1</li><li>2</li><li>3</li><li>4</li><li>5</li><li>6</li></ul>');
    const list = doc.querySelectorAll('li:nth-child(3n)');
    expect(list.length).toBe(2);
    expect(list.item(0)!.textContent).toBe('3');
    expect(list.item(1)!.textContent).toBe('6');
  });

  it(':nth-child(3n-1) matches positions 2, 5, 8...', () => {
    const doc = createDoc('<ul><li>1</li><li>2</li><li>3</li><li>4</li><li>5</li><li>6</li></ul>');
    const list = doc.querySelectorAll('li:nth-child(3n-1)');
    // 3*1-1=2, 3*2-1=5
    expect(list.length).toBe(2);
    expect(list.item(0)!.textContent).toBe('2');
    expect(list.item(1)!.textContent).toBe('5');
  });

  it(':nth-child(-n+3) matches first 3 elements', () => {
    const doc = createDoc('<ul><li>1</li><li>2</li><li>3</li><li>4</li><li>5</li></ul>');
    const list = doc.querySelectorAll('li:nth-child(-n+3)');
    expect(list.length).toBe(3);
    expect(list.item(0)!.textContent).toBe('1');
    expect(list.item(1)!.textContent).toBe('2');
    expect(list.item(2)!.textContent).toBe('3');
  });

  it(':nth-child(n) matches all elements', () => {
    const doc = createDoc('<ul><li>1</li><li>2</li><li>3</li></ul>');
    const list = doc.querySelectorAll('li:nth-child(n)');
    // n=0 -> pos=0 (no match), n=1 -> pos=1, n=2 -> pos=2, n=3 -> pos=3
    // Actually n+0: A=1, B=0 => pos = 1*n + 0, n>=0 => pos=0,1,2,3...
    // But positions are 1-indexed, so positions 1,2,3 all match (n=1,2,3)
    expect(list.length).toBe(3);
  });
});

// ════════════════════════════════════════════════════════════════════════
// :nth-last-child()
// ════════════════════════════════════════════════════════════════════════

describe(':nth-last-child()', () => {
  it(':nth-last-child(1) matches last child', () => {
    const doc = createDoc('<ul><li>1</li><li>2</li><li>3</li></ul>');
    const el = doc.querySelector('li:nth-last-child(1)');
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe('3');
  });

  it(':nth-last-child(2) matches second-to-last', () => {
    const doc = createDoc('<ul><li>1</li><li>2</li><li>3</li></ul>');
    const el = doc.querySelector('li:nth-last-child(2)');
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe('2');
  });

  it(':nth-last-child(odd) matches from the end', () => {
    const doc = createDoc('<ul><li>1</li><li>2</li><li>3</li><li>4</li></ul>');
    // Positions from end: 4=1, 3=2, 2=3, 1=4
    // odd from end: positions 1,3 from end = items 4,2
    const list = doc.querySelectorAll('li:nth-last-child(odd)');
    expect(list.length).toBe(2);
    expect(list.item(0)!.textContent).toBe('2');
    expect(list.item(1)!.textContent).toBe('4');
  });
});

// ════════════════════════════════════════════════════════════════════════
// :only-child
// ════════════════════════════════════════════════════════════════════════

describe(':only-child', () => {
  it('matches when element is the only child', () => {
    const doc = createDoc('<div><p>alone</p></div>');
    const el = doc.querySelector('p:only-child');
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe('alone');
  });

  it('does not match when there are siblings', () => {
    const doc = createDoc('<div><p>a</p><p>b</p></div>');
    const el = doc.querySelector('p:only-child');
    expect(el).toBeNull();
  });

  it('does not match when there are different-type siblings', () => {
    const doc = createDoc('<div><p>a</p><span>b</span></div>');
    const el = doc.querySelector('p:only-child');
    expect(el).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════════════
// :empty
// ════════════════════════════════════════════════════════════════════════

describe(':empty', () => {
  it('matches element with no children', () => {
    const doc = createDoc('<div></div><div>text</div>');
    const el = doc.querySelector('div:empty');
    expect(el).not.toBeNull();
    // The empty div should be the first one
  });

  it('does not match element with text content', () => {
    const doc = createDoc('<p>some text</p>');
    const el = doc.querySelector('p:empty');
    expect(el).toBeNull();
  });

  it('does not match element with child elements', () => {
    const doc = createDoc('<div><span></span></div>');
    const el = doc.querySelector('div:empty');
    expect(el).toBeNull();
  });

  it('matches self-closing elements', () => {
    const doc = createDoc('<input><p>text</p>');
    const el = doc.querySelector('input:empty');
    expect(el).not.toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════════════
// :root
// ════════════════════════════════════════════════════════════════════════

describe(':root', () => {
  it('matches the html element', () => {
    const doc = new Document();
    const el = doc.querySelector(':root');
    expect(el).not.toBeNull();
    expect(el!.tagName).toBe('HTML');
  });

  it('does not match non-root elements', () => {
    const doc = createDoc('<div></div>');
    const list = doc.querySelectorAll(':root');
    expect(list.length).toBe(1);
    expect(list.item(0)!.tagName).toBe('HTML');
  });
});

// ════════════════════════════════════════════════════════════════════════
// :not()
// ════════════════════════════════════════════════════════════════════════

describe(':not()', () => {
  it(':not(.skip) excludes elements with class skip', () => {
    const doc = createDoc('<p class="skip">a</p><p>b</p><p class="skip">c</p>');
    const list = doc.querySelectorAll('p:not(.skip)');
    expect(list.length).toBe(1);
    expect(list.item(0)!.textContent).toBe('b');
  });

  it(':not(div) matches non-div elements', () => {
    const doc = createDoc('<div>a</div><span>b</span><p>c</p>');
    const list = doc.querySelectorAll('body > :not(div)');
    expect(list.length).toBe(2);
  });

  it(':not(#main) excludes element with id main', () => {
    const doc = createDoc('<div id="main">a</div><div id="other">b</div>');
    const list = doc.querySelectorAll('div:not(#main)');
    expect(list.length).toBe(1);
    expect(list.item(0)!.getAttribute('id')).toBe('other');
  });

  it(':not([disabled]) matches enabled elements', () => {
    const doc = createDoc('<input disabled><input><input disabled>');
    const list = doc.querySelectorAll('input:not([disabled])');
    expect(list.length).toBe(1);
  });

  it(':not(:first-child) excludes first child', () => {
    const doc = createDoc('<ul><li>1</li><li>2</li><li>3</li></ul>');
    const list = doc.querySelectorAll('li:not(:first-child)');
    expect(list.length).toBe(2);
    expect(list.item(0)!.textContent).toBe('2');
    expect(list.item(1)!.textContent).toBe('3');
  });
});

// ════════════════════════════════════════════════════════════════════════
// :enabled, :disabled
// ════════════════════════════════════════════════════════════════════════

describe(':enabled and :disabled', () => {
  it(':disabled matches disabled input', () => {
    const doc = createDoc('<input disabled><input>');
    const el = doc.querySelector('input:disabled');
    expect(el).not.toBeNull();
    expect(el!.hasAttribute('disabled')).toBe(true);
  });

  it(':enabled matches non-disabled input', () => {
    const doc = createDoc('<input disabled><input>');
    const list = doc.querySelectorAll('input:enabled');
    expect(list.length).toBe(1);
  });

  it(':disabled matches disabled button', () => {
    const doc = createDoc('<button disabled>click</button>');
    const el = doc.querySelector('button:disabled');
    expect(el).not.toBeNull();
  });

  it(':disabled does not match non-form elements', () => {
    const doc = createDoc('<div disabled>x</div>');
    const el = doc.querySelector('div:disabled');
    expect(el).toBeNull();
  });

  it(':enabled matches select and textarea', () => {
    const doc = createDoc('<select><option>a</option></select><textarea></textarea>');
    const list = doc.querySelectorAll(':enabled');
    // select + textarea
    expect(list.length).toBe(2);
  });
});

// ════════════════════════════════════════════════════════════════════════
// :checked
// ════════════════════════════════════════════════════════════════════════

describe(':checked', () => {
  it('matches checked checkbox', () => {
    const doc = createDoc('<input type="checkbox" checked><input type="checkbox">');
    const list = doc.querySelectorAll('input:checked');
    expect(list.length).toBe(1);
  });

  it('matches checked radio', () => {
    const doc = createDoc('<input type="radio" checked><input type="radio">');
    const list = doc.querySelectorAll('input:checked');
    expect(list.length).toBe(1);
  });

  it('matches selected option', () => {
    const doc = createDoc('<select><option>a</option><option selected>b</option></select>');
    const el = doc.querySelector('option:checked');
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe('b');
  });

  it('does not match unchecked checkbox', () => {
    const doc = createDoc('<input type="checkbox">');
    const el = doc.querySelector('input:checked');
    expect(el).toBeNull();
  });

  it('does not match non-checkbox/radio inputs', () => {
    const doc = createDoc('<input type="text" checked>');
    const el = doc.querySelector('input:checked');
    expect(el).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════════════
// :required, :optional
// ════════════════════════════════════════════════════════════════════════

describe(':required and :optional', () => {
  it(':required matches input with required attribute', () => {
    const doc = createDoc('<input required><input>');
    const list = doc.querySelectorAll('input:required');
    expect(list.length).toBe(1);
  });

  it(':optional matches input without required attribute', () => {
    const doc = createDoc('<input required><input>');
    const list = doc.querySelectorAll('input:optional');
    expect(list.length).toBe(1);
  });

  it(':required does not match non-form elements', () => {
    const doc = createDoc('<div required>x</div>');
    const el = doc.querySelector('div:required');
    expect(el).toBeNull();
  });

  it(':optional matches textarea without required', () => {
    const doc = createDoc('<textarea></textarea>');
    const el = doc.querySelector('textarea:optional');
    expect(el).not.toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════════════
// :first-of-type, :last-of-type
// ════════════════════════════════════════════════════════════════════════

describe(':first-of-type', () => {
  it('matches first span among mixed siblings', () => {
    const doc = createDoc('<div><p>a</p><span>first span</span><span>second span</span></div>');
    const el = doc.querySelector('span:first-of-type');
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe('first span');
  });

  it('matches first p even if not first child', () => {
    const doc = createDoc('<div><span>x</span><p>first p</p><p>second p</p></div>');
    const el = doc.querySelector('p:first-of-type');
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe('first p');
  });
});

describe(':last-of-type', () => {
  it('matches last span among mixed siblings', () => {
    const doc = createDoc('<div><span>first</span><span>last</span><p>x</p></div>');
    const el = doc.querySelector('span:last-of-type');
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe('last');
  });

  it('matches last p even if not last child', () => {
    const doc = createDoc('<div><p>a</p><p>last p</p><span>x</span></div>');
    const el = doc.querySelector('p:last-of-type');
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe('last p');
  });
});

// ════════════════════════════════════════════════════════════════════════
// Combined pseudo-classes
// ════════════════════════════════════════════════════════════════════════

describe('Combined pseudo-classes', () => {
  it('div:first-child:not(.skip) combines pseudo and :not()', () => {
    const doc = createDoc('<section><div class="skip">a</div><div>b</div></section><section><div>c</div></section>');
    const list = doc.querySelectorAll('div:first-child:not(.skip)');
    expect(list.length).toBe(1);
    expect(list.item(0)!.textContent).toBe('c');
  });

  it('ul > li:nth-child(odd) combines child combinator and pseudo', () => {
    const doc = createDoc('<ul><li>1</li><li>2</li><li>3</li><li>4</li><li>5</li></ul>');
    const list = doc.querySelectorAll('ul > li:nth-child(odd)');
    expect(list.length).toBe(3);
    expect(list.item(0)!.textContent).toBe('1');
    expect(list.item(1)!.textContent).toBe('3');
    expect(list.item(2)!.textContent).toBe('5');
  });

  it('p:first-child:last-child matches only-child p', () => {
    const doc = createDoc('<div><p>only</p></div><div><p>a</p><p>b</p></div>');
    const list = doc.querySelectorAll('p:first-child:last-child');
    expect(list.length).toBe(1);
    expect(list.item(0)!.textContent).toBe('only');
  });

  it(':not(.a):not(.b) excludes both classes', () => {
    const doc = createDoc('<p class="a">1</p><p class="b">2</p><p class="c">3</p>');
    const list = doc.querySelectorAll('p:not(.a):not(.b)');
    expect(list.length).toBe(1);
    expect(list.item(0)!.textContent).toBe('3');
  });
});

// ════════════════════════════════════════════════════════════════════════
// Complex selectors mixing combinators and pseudo-classes
// ════════════════════════════════════════════════════════════════════════

describe('Complex selectors with new features', () => {
  it('div > p + p matches second consecutive p inside div', () => {
    const doc = createDoc('<div><p>1</p><p>2</p><p>3</p></div>');
    const list = doc.querySelectorAll('div > p + p');
    expect(list.length).toBe(2);
    expect(list.item(0)!.textContent).toBe('2');
    expect(list.item(1)!.textContent).toBe('3');
  });

  it('h2 ~ p:first-of-type matches first p after h2', () => {
    const doc = createDoc('<div><h2>T</h2><span>x</span><p>first p</p><p>second p</p></div>');
    const el = doc.querySelector('h2 ~ p:first-of-type');
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe('first p');
  });

  it(':root > body > div matches direct chain from root', () => {
    const doc = createDoc('<div>content</div>');
    const el = doc.querySelector(':root > body > div');
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe('content');
  });

  it('li:nth-child(2n+1):not(:last-child) — odd items except last', () => {
    const doc = createDoc('<ul><li>1</li><li>2</li><li>3</li><li>4</li><li>5</li></ul>');
    // Odd: 1,3,5. Last child: 5. So result: 1,3
    const list = doc.querySelectorAll('li:nth-child(2n+1):not(:last-child)');
    expect(list.length).toBe(2);
    expect(list.item(0)!.textContent).toBe('1');
    expect(list.item(1)!.textContent).toBe('3');
  });

  it('chained: h1 + p ~ span (adjacent then general sibling)', () => {
    const doc = createDoc('<div><h1>T</h1><p>P</p><span>S1</span><span>S2</span></div>');
    const list = doc.querySelectorAll('h1 + p ~ span');
    expect(list.length).toBe(2);
  });
});

// ════════════════════════════════════════════════════════════════════════
// Parser edge cases for new features
// ════════════════════════════════════════════════════════════════════════

describe('Parser edge cases for pseudo-classes', () => {
  it('parses :first-child as pseudo node', () => {
    const ast = parseSelector('p:first-child');
    const selectors = ast.selectors[0].head.selectors;
    expect(selectors).toHaveLength(2);
    expect(selectors[0]).toEqual({ type: 'type', name: 'p' });
    expect(selectors[1]).toEqual({ type: 'pseudo', name: 'first-child', argument: null });
  });

  it('parses :nth-child(2n+1) with argument', () => {
    const ast = parseSelector(':nth-child(2n+1)');
    const sel = ast.selectors[0].head.selectors[0];
    expect(sel).toEqual({ type: 'pseudo', name: 'nth-child', argument: '2n+1' });
  });

  it('parses :not(.foo) as pseudoNot node', () => {
    const ast = parseSelector(':not(.foo)');
    const sel = ast.selectors[0].head.selectors[0] as any;
    expect(sel.type).toBe('pseudoNot');
    expect(sel.innerSelectors).toHaveLength(1);
    expect(sel.innerSelectors[0]).toEqual({ type: 'class', name: 'foo' });
  });

  it('parses :not(div.active) with compound inner selector', () => {
    const ast = parseSelector(':not(div.active)');
    const sel = ast.selectors[0].head.selectors[0] as any;
    expect(sel.type).toBe('pseudoNot');
    expect(sel.innerSelectors).toHaveLength(2);
    expect(sel.innerSelectors[0]).toEqual({ type: 'type', name: 'div' });
    expect(sel.innerSelectors[1]).toEqual({ type: 'class', name: 'active' });
  });

  it('parses whitespace around + combinator', () => {
    const ast = parseSelector('h1  +  p');
    expect(ast.selectors[0].tail[0].combinator).toBe('adjacentSibling');
  });

  it('parses whitespace around ~ combinator', () => {
    const ast = parseSelector('h1  ~  p');
    expect(ast.selectors[0].tail[0].combinator).toBe('generalSibling');
  });
});

// ════════════════════════════════════════════════════════════════════════
// Element.matches() with new features
// ════════════════════════════════════════════════════════════════════════

describe('Element.matches() with pseudo-classes', () => {
  it('element.matches(":first-child") works', () => {
    const doc = createDoc('<div><p>first</p><p>second</p></div>');
    const first = doc.querySelector('div > p')!;
    expect(first.matches(':first-child')).toBe(true);
    expect(first.matches(':last-child')).toBe(false);
  });

  it('element.matches(":empty") works', () => {
    const doc = createDoc('<div></div>');
    const div = doc.querySelector('div')!;
    expect(div.matches(':empty')).toBe(true);
  });

  it('element.matches(":not(.x)") works', () => {
    const doc = createDoc('<div class="y">text</div>');
    const div = doc.querySelector('div')!;
    expect(div.matches(':not(.x)')).toBe(true);
    expect(div.matches(':not(.y)')).toBe(false);
  });
});
