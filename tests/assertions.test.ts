import { describe, it, expect } from 'vitest';
import { Document } from '../src/nodes/Document';
import { DixieAssertions } from '../src/assertions/DixieAssertions';
import type { ConsoleCaptureLike } from '../src/assertions/DixieAssertions';
import { DixieSnapshot } from '../src/assertions/DixieSnapshot';

// ── Helpers ───────────────────────────────────────────────────────────

/** Create a Document with HTML injected into body. */
function createDoc(bodyHTML: string = ''): Document {
  const doc = new Document();
  if (bodyHTML) {
    doc.body.innerHTML = bodyHTML;
  }
  return doc;
}

/** Create a mock ConsoleCapture. */
function mockConsole(
  errors: string[] = [],
  warnings: string[] = [],
): ConsoleCaptureLike {
  return {
    getErrors: () => errors,
    getWarnings: () => warnings,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// DixieAssertions
// ═══════════════════════════════════════════════════════════════════════

describe('DixieAssertions', () => {
  // ── expectClean ─────────────────────────────────────────────────────

  describe('expectClean()', () => {
    it('passes when body has content and no console capture', () => {
      const doc = createDoc('<p>Hello</p>');
      const a = new DixieAssertions(doc);
      const result = a.expectClean();
      expect(result.passed).toBe(true);
      expect(result.assertion).toContain('cleanly');
      expect(result.details).toBeUndefined();
    });

    it('passes when body has content and console is clean', () => {
      const doc = createDoc('<p>Hello</p>');
      const a = new DixieAssertions(doc, mockConsole());
      const result = a.expectClean();
      expect(result.passed).toBe(true);
    });

    it('fails when body is empty (no console capture)', () => {
      const doc = new Document();
      const a = new DixieAssertions(doc);
      const result = a.expectClean();
      expect(result.passed).toBe(false);
      expect(result.details).toContain('Body is empty');
    });

    it('fails when console has errors', () => {
      const doc = createDoc('<p>Content</p>');
      const a = new DixieAssertions(doc, mockConsole(['TypeError: x is not a function']));
      const result = a.expectClean();
      expect(result.passed).toBe(false);
      expect(result.details).toContain('console error');
      expect(result.details).toContain('TypeError');
    });

    it('fails when console has warnings', () => {
      const doc = createDoc('<p>Content</p>');
      const a = new DixieAssertions(doc, mockConsole([], ['Deprecation warning']));
      const result = a.expectClean();
      expect(result.passed).toBe(false);
      expect(result.details).toContain('console warning');
      expect(result.details).toContain('Deprecation');
    });

    it('reports all failures when body empty AND console has errors', () => {
      const doc = new Document();
      const a = new DixieAssertions(doc, mockConsole(['err1'], ['warn1']));
      const result = a.expectClean();
      expect(result.passed).toBe(false);
      expect(result.details).toContain('Body is empty');
      expect(result.details).toContain('console error');
      expect(result.details).toContain('console warning');
    });

    it('skips console checks when no capture provided', () => {
      // Even if there "would be" errors, no capture = no check
      const doc = createDoc('<p>OK</p>');
      const a = new DixieAssertions(doc);
      const result = a.expectClean();
      expect(result.passed).toBe(true);
    });
  });

  // ── expectContent ───────────────────────────────────────────────────

  describe('expectContent()', () => {
    it('passes when body has content', () => {
      const doc = createDoc('<div>Hello World</div>');
      const a = new DixieAssertions(doc);
      const result = a.expectContent();
      expect(result.passed).toBe(true);
      expect(result.assertion).toContain('content');
    });

    it('fails when body is empty', () => {
      const doc = new Document();
      const a = new DixieAssertions(doc);
      const result = a.expectContent();
      expect(result.passed).toBe(false);
      expect(result.details).toBe('Body is empty (innerHTML length: 0)');
    });

    it('fails when body contains only whitespace', () => {
      const doc = new Document();
      // Add a text node with only whitespace
      doc.body.appendChild(doc.createTextNode('   '));
      const a = new DixieAssertions(doc);
      const result = a.expectContent();
      expect(result.passed).toBe(false);
    });

    it('passes when body has a single element', () => {
      const doc = createDoc('<span></span>');
      const a = new DixieAssertions(doc);
      const result = a.expectContent();
      expect(result.passed).toBe(true);
    });
  });

  // ── expectElement ───────────────────────────────────────────────────

  describe('expectElement()', () => {
    it('passes when element exists by tag name', () => {
      const doc = createDoc('<div><p>Hello</p></div>');
      const a = new DixieAssertions(doc);
      const result = a.expectElement('p');
      expect(result.passed).toBe(true);
    });

    it('passes when element exists by class', () => {
      const doc = createDoc('<div class="app"><span class="title">Hi</span></div>');
      const a = new DixieAssertions(doc);
      const result = a.expectElement('.title');
      expect(result.passed).toBe(true);
    });

    it('passes when element exists by id', () => {
      const doc = createDoc('<div id="root"></div>');
      const a = new DixieAssertions(doc);
      const result = a.expectElement('#root');
      expect(result.passed).toBe(true);
    });

    it('fails when element does not exist', () => {
      const doc = createDoc('<div>Hello</div>');
      const a = new DixieAssertions(doc);
      const result = a.expectElement('.nonexistent');
      expect(result.passed).toBe(false);
      expect(result.details).toBe('No element matches selector: .nonexistent');
    });

    it('assertion description includes selector', () => {
      const doc = createDoc('<div></div>');
      const a = new DixieAssertions(doc);
      const result = a.expectElement('div');
      expect(result.assertion).toContain('div');
    });
  });

  // ── expectNoElement ─────────────────────────────────────────────────

  describe('expectNoElement()', () => {
    it('passes when element does not exist', () => {
      const doc = createDoc('<div>Hello</div>');
      const a = new DixieAssertions(doc);
      const result = a.expectNoElement('.error');
      expect(result.passed).toBe(true);
    });

    it('fails when element exists', () => {
      const doc = createDoc('<div class="error">Oops</div>');
      const a = new DixieAssertions(doc);
      const result = a.expectNoElement('.error');
      expect(result.passed).toBe(false);
      expect(result.details).toBe('Element found matching selector: .error');
    });
  });

  // ── expectText ──────────────────────────────────────────────────────

  describe('expectText()', () => {
    it('passes when text is found', () => {
      const doc = createDoc('<p>Hello World</p>');
      const a = new DixieAssertions(doc);
      const result = a.expectText('Hello');
      expect(result.passed).toBe(true);
    });

    it('passes with partial text match', () => {
      const doc = createDoc('<p>The quick brown fox jumps</p>');
      const a = new DixieAssertions(doc);
      const result = a.expectText('brown fox');
      expect(result.passed).toBe(true);
    });

    it('fails when text is not found', () => {
      const doc = createDoc('<p>Hello World</p>');
      const a = new DixieAssertions(doc);
      const result = a.expectText('Goodbye');
      expect(result.passed).toBe(false);
      expect(result.details).toContain("Text 'Goodbye' not found in page");
      expect(result.details).toContain('Body text starts with');
    });

    it('shows truncated body text in failure details', () => {
      // Create a long text
      const longText = 'A'.repeat(300);
      const doc = createDoc(`<p>${longText}</p>`);
      const a = new DixieAssertions(doc);
      const result = a.expectText('NOTFOUND');
      expect(result.passed).toBe(false);
      expect(result.details).toContain('...');
    });

    it('does not truncate short body text', () => {
      const doc = createDoc('<p>Short</p>');
      const a = new DixieAssertions(doc);
      const result = a.expectText('NOPE');
      expect(result.passed).toBe(false);
      // Short text should not have "..."
      expect(result.details).not.toMatch(/\.\.\.'/);
    });

    it('is case-sensitive', () => {
      const doc = createDoc('<p>Hello World</p>');
      const a = new DixieAssertions(doc);
      const result = a.expectText('hello world');
      expect(result.passed).toBe(false);
    });
  });

  // ── expectNoText ────────────────────────────────────────────────────

  describe('expectNoText()', () => {
    it('passes when text is not present', () => {
      const doc = createDoc('<p>Hello</p>');
      const a = new DixieAssertions(doc);
      const result = a.expectNoText('Goodbye');
      expect(result.passed).toBe(true);
    });

    it('fails when text is present', () => {
      const doc = createDoc('<p>Error: something went wrong</p>');
      const a = new DixieAssertions(doc);
      const result = a.expectNoText('Error');
      expect(result.passed).toBe(false);
      expect(result.details).toContain("Text 'Error' was found in page but should not be present");
    });
  });

  // ── expectAttribute ─────────────────────────────────────────────────

  describe('expectAttribute()', () => {
    it('passes when attribute exists (no value check)', () => {
      const doc = createDoc('<input type="text" name="email">');
      const a = new DixieAssertions(doc);
      const result = a.expectAttribute('input', 'type');
      expect(result.passed).toBe(true);
    });

    it('passes when attribute matches expected value', () => {
      const doc = createDoc('<input type="email" name="user-email">');
      const a = new DixieAssertions(doc);
      const result = a.expectAttribute('input', 'type', 'email');
      expect(result.passed).toBe(true);
    });

    it('fails when element not found', () => {
      const doc = createDoc('<div>No inputs here</div>');
      const a = new DixieAssertions(doc);
      const result = a.expectAttribute('.missing', 'href');
      expect(result.passed).toBe(false);
      expect(result.details).toContain('No element matches selector');
    });

    it('fails when attribute is missing', () => {
      const doc = createDoc('<div id="box"></div>');
      const a = new DixieAssertions(doc);
      const result = a.expectAttribute('#box', 'data-role');
      expect(result.passed).toBe(false);
      expect(result.details).toContain("does not have attribute 'data-role'");
    });

    it('fails when attribute value does not match', () => {
      const doc = createDoc('<input type="text">');
      const a = new DixieAssertions(doc);
      const result = a.expectAttribute('input', 'type', 'email');
      expect(result.passed).toBe(false);
      expect(result.details).toContain("value is 'text'");
      expect(result.details).toContain("expected 'email'");
    });

    it('assertion description includes value when provided', () => {
      const doc = createDoc('<input type="text">');
      const a = new DixieAssertions(doc);
      const result = a.expectAttribute('input', 'type', 'email');
      expect(result.assertion).toContain('type="email"');
    });

    it('assertion description omits value when not provided', () => {
      const doc = createDoc('<input type="text">');
      const a = new DixieAssertions(doc);
      const result = a.expectAttribute('input', 'type');
      expect(result.assertion).not.toContain('=');
    });
  });

  // ── expectElementCount ──────────────────────────────────────────────

  describe('expectElementCount()', () => {
    it('passes when count matches', () => {
      const doc = createDoc('<ul><li>A</li><li>B</li><li>C</li></ul>');
      const a = new DixieAssertions(doc);
      const result = a.expectElementCount('li', 3);
      expect(result.passed).toBe(true);
    });

    it('fails when count does not match', () => {
      const doc = createDoc('<ul><li>A</li><li>B</li></ul>');
      const a = new DixieAssertions(doc);
      const result = a.expectElementCount('li', 5);
      expect(result.passed).toBe(false);
      expect(result.details).toContain("Expected 5 elements matching 'li', found 2");
    });

    it('reports 0 when no elements match', () => {
      const doc = createDoc('<div>No list items</div>');
      const a = new DixieAssertions(doc);
      const result = a.expectElementCount('li', 1);
      expect(result.passed).toBe(false);
      expect(result.details).toContain('found 0');
    });

    it('passes with count 0 when no elements match', () => {
      const doc = createDoc('<div>No list items</div>');
      const a = new DixieAssertions(doc);
      const result = a.expectElementCount('li', 0);
      expect(result.passed).toBe(true);
    });
  });

  // ── runAll ──────────────────────────────────────────────────────────

  describe('runAll()', () => {
    it('returns results for all assertions', () => {
      const doc = createDoc('<p>Hello</p>');
      const a = new DixieAssertions(doc);
      const results = a.runAll([
        () => a.expectContent(),
        () => a.expectElement('p'),
        () => a.expectText('Hello'),
      ]);
      expect(results).toHaveLength(3);
      expect(results.every(r => r.passed)).toBe(true);
    });

    it('does not short-circuit on failure', () => {
      const doc = createDoc('<p>Hello</p>');
      const a = new DixieAssertions(doc);
      const results = a.runAll([
        () => a.expectText('NOPE'),      // fails
        () => a.expectElement('p'),       // passes
        () => a.expectElement('.nope'),   // fails
      ]);
      expect(results).toHaveLength(3);
      expect(results[0].passed).toBe(false);
      expect(results[1].passed).toBe(true);
      expect(results[2].passed).toBe(false);
    });

    it('returns empty array for empty input', () => {
      const doc = createDoc('<p>Hello</p>');
      const a = new DixieAssertions(doc);
      const results = a.runAll([]);
      expect(results).toHaveLength(0);
    });
  });

  // ── Throwing variants ───────────────────────────────────────────────

  describe('assertClean()', () => {
    it('does not throw when clean', () => {
      const doc = createDoc('<p>OK</p>');
      const a = new DixieAssertions(doc);
      expect(() => a.assertClean()).not.toThrow();
    });

    it('throws when not clean', () => {
      const doc = new Document();
      const a = new DixieAssertions(doc);
      expect(() => a.assertClean()).toThrow('Assertion failed');
    });
  });

  describe('assertContent()', () => {
    it('does not throw when body has content', () => {
      const doc = createDoc('<div>Hi</div>');
      const a = new DixieAssertions(doc);
      expect(() => a.assertContent()).not.toThrow();
    });

    it('throws when body is empty', () => {
      const doc = new Document();
      const a = new DixieAssertions(doc);
      expect(() => a.assertContent()).toThrow('Body is empty');
    });
  });

  describe('assertElement()', () => {
    it('does not throw when element exists', () => {
      const doc = createDoc('<div id="app"></div>');
      const a = new DixieAssertions(doc);
      expect(() => a.assertElement('#app')).not.toThrow();
    });

    it('throws when element not found', () => {
      const doc = createDoc('<div></div>');
      const a = new DixieAssertions(doc);
      expect(() => a.assertElement('#missing')).toThrow('No element matches selector');
    });
  });

  describe('assertNoElement()', () => {
    it('does not throw when element absent', () => {
      const doc = createDoc('<div></div>');
      const a = new DixieAssertions(doc);
      expect(() => a.assertNoElement('.error')).not.toThrow();
    });

    it('throws when element is present', () => {
      const doc = createDoc('<div class="error">Bad</div>');
      const a = new DixieAssertions(doc);
      expect(() => a.assertNoElement('.error')).toThrow('Element found matching selector');
    });
  });

  describe('assertText()', () => {
    it('does not throw when text is found', () => {
      const doc = createDoc('<p>Welcome back</p>');
      const a = new DixieAssertions(doc);
      expect(() => a.assertText('Welcome')).not.toThrow();
    });

    it('throws when text is not found', () => {
      const doc = createDoc('<p>Hello</p>');
      const a = new DixieAssertions(doc);
      expect(() => a.assertText('Goodbye')).toThrow("Text 'Goodbye' not found");
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// DixieSnapshot
// ═══════════════════════════════════════════════════════════════════════

describe('DixieSnapshot', () => {
  // ── toJSON ──────────────────────────────────────────────────────────

  describe('toJSON()', () => {
    it('captures title', () => {
      const doc = createDoc('<p>Hello</p>');
      doc.title = 'Test Page';
      const snap = new DixieSnapshot(doc);
      const state = snap.toJSON();
      expect(state.title).toBe('Test Page');
    });

    it('captures bodyHTML', () => {
      const doc = createDoc('<p>Hello</p>');
      const snap = new DixieSnapshot(doc);
      const state = snap.toJSON();
      expect(state.bodyHTML).toContain('<p>Hello</p>');
    });

    it('captures bodyText (trimmed)', () => {
      const doc = createDoc('<p>  Hello World  </p>');
      const snap = new DixieSnapshot(doc);
      const state = snap.toJSON();
      expect(state.bodyText).toBe('Hello World');
    });

    it('counts elements', () => {
      const doc = createDoc('<div><p>A</p><p>B</p></div>');
      const snap = new DixieSnapshot(doc);
      const state = snap.toJSON();
      // div + 2 p = 3 elements
      expect(state.elementCount).toBe(3);
    });

    it('url defaults to empty string', () => {
      const doc = createDoc('<p>Hi</p>');
      const snap = new DixieSnapshot(doc);
      expect(snap.toJSON().url).toBe('');
    });

    it('collects headings', () => {
      const doc = createDoc('<h1>Title</h1><h2>Subtitle</h2><p>Body text</p>');
      const snap = new DixieSnapshot(doc);
      const state = snap.toJSON();
      expect(state.headings).toHaveLength(2);
      expect(state.headings[0]).toEqual({ level: 1, text: 'Title' });
      expect(state.headings[1]).toEqual({ level: 2, text: 'Subtitle' });
    });

    it('collects links', () => {
      const doc = createDoc('<a href="/about">About Us</a><a href="/contact">Contact</a>');
      const snap = new DixieSnapshot(doc);
      const state = snap.toJSON();
      expect(state.links).toHaveLength(2);
      expect(state.links[0]).toEqual({ href: '/about', text: 'About Us' });
      expect(state.links[1]).toEqual({ href: '/contact', text: 'Contact' });
    });

    it('collects images', () => {
      const doc = createDoc('<img src="/logo.png" alt="Logo"><img src="/hero.jpg" alt="Hero">');
      const snap = new DixieSnapshot(doc);
      const state = snap.toJSON();
      expect(state.images).toHaveLength(2);
      expect(state.images[0]).toEqual({ src: '/logo.png', alt: 'Logo' });
      expect(state.images[1]).toEqual({ src: '/hero.jpg', alt: 'Hero' });
    });

    it('collects forms with field count', () => {
      const doc = createDoc(
        '<form action="/submit" method="POST">' +
        '<input type="text" name="name">' +
        '<input type="email" name="email">' +
        '<select name="role"><option>Admin</option></select>' +
        '<textarea name="bio"></textarea>' +
        '<button type="submit">Send</button>' +
        '</form>'
      );
      const snap = new DixieSnapshot(doc);
      const state = snap.toJSON();
      expect(state.forms).toHaveLength(1);
      expect(state.forms[0].action).toBe('/submit');
      expect(state.forms[0].method).toBe('POST');
      // input + input + select + textarea = 4 fields (button is not a field)
      expect(state.forms[0].fieldCount).toBe(4);
    });

    it('returns empty arrays for page with no special elements', () => {
      const doc = createDoc('<p>Just text</p>');
      const snap = new DixieSnapshot(doc);
      const state = snap.toJSON();
      expect(state.forms).toHaveLength(0);
      expect(state.links).toHaveLength(0);
      expect(state.headings).toHaveLength(0);
      expect(state.images).toHaveLength(0);
    });
  });

  // ── toDebugString ───────────────────────────────────────────────────

  describe('toDebugString()', () => {
    it('produces indented tree output', () => {
      const doc = createDoc('<div><p>Hello</p></div>');
      const snap = new DixieSnapshot(doc);
      const output = snap.toDebugString();
      expect(output).toContain('<html>');
      expect(output).toContain('<head>');
      expect(output).toContain('<body>');
      expect(output).toContain('<div>');
      expect(output).toContain('<p>');
      expect(output).toContain('Hello');
    });

    it('shows key attributes (id, class)', () => {
      const doc = createDoc('<div id="app" class="main"><span class="label">Hi</span></div>');
      const snap = new DixieSnapshot(doc);
      const output = snap.toDebugString();
      expect(output).toContain('id="app"');
      expect(output).toContain('class="main"');
      expect(output).toContain('class="label"');
    });

    it('shows form-related attributes', () => {
      const doc = createDoc('<form action="/login" method="POST"><input type="text" name="user"></form>');
      const snap = new DixieSnapshot(doc);
      const output = snap.toDebugString();
      expect(output).toContain('action="/login"');
      expect(output).toContain('method="POST"');
      expect(output).toContain('type="text"');
      expect(output).toContain('name="user"');
    });

    it('indents nested elements with 2 spaces per level', () => {
      const doc = createDoc('<div><p>Text</p></div>');
      const snap = new DixieSnapshot(doc);
      const lines = snap.toDebugString().split('\n');
      // <html> at depth 0 → no indent
      const htmlLine = lines.find(l => l.includes('<html>'));
      expect(htmlLine).toBe('<html>');
      // <body> at depth 1 → 2 spaces
      const bodyLine = lines.find(l => l.includes('<body>'));
      expect(bodyLine).toBe('  <body>');
    });

    it('truncates long text nodes at 80 chars', () => {
      const longText = 'A'.repeat(120);
      const doc = createDoc(`<p>${longText}</p>`);
      const snap = new DixieSnapshot(doc);
      const output = snap.toDebugString();
      // Should have truncated text with "..."
      expect(output).toContain('...');
      // Should not contain full 120-char text on one line
      const textLine = output.split('\n').find(l => l.includes('AAA'));
      expect(textLine!.length).toBeLessThan(120);
    });

    it('respects maxDepth parameter', () => {
      const doc = createDoc('<div><p><span><b>Deep</b></span></p></div>');
      const snap = new DixieSnapshot(doc);
      // html=0, head=1, body=1, div=2, p=3, span=4, b=5
      const shallow = snap.toDebugString(3);
      expect(shallow).toContain('<div>');
      expect(shallow).toContain('<p>');
      // span is at depth 4 which is > maxDepth 3
      expect(shallow).not.toContain('<span>');
      expect(shallow).not.toContain('<b>');
    });

    it('skips empty text nodes', () => {
      // Create a doc and add an empty text node
      const doc = new Document();
      doc.body.appendChild(doc.createElement('div'));
      doc.body.appendChild(doc.createTextNode(''));
      doc.body.appendChild(doc.createTextNode('   '));
      const snap = new DixieSnapshot(doc);
      const lines = snap.toDebugString().split('\n');
      // No blank text lines
      const textLines = lines.filter(l => l.trim() === '');
      expect(textLines).toHaveLength(0);
    });
  });

  // ── toSummary ───────────────────────────────────────────────────────

  describe('toSummary()', () => {
    it('has correct title', () => {
      const doc = createDoc('<p>Hello</p>');
      doc.title = 'Summary Test';
      const snap = new DixieSnapshot(doc);
      expect(snap.toSummary().title).toBe('Summary Test');
    });

    it('counts elements correctly', () => {
      const doc = createDoc('<div><p>A</p><p>B</p><span>C</span></div>');
      const snap = new DixieSnapshot(doc);
      // div + 2p + span = 4
      expect(snap.toSummary().elementCount).toBe(4);
    });

    it('reports textLength', () => {
      const doc = createDoc('<p>Hello World</p>');
      const snap = new DixieSnapshot(doc);
      expect(snap.toSummary().textLength).toBe('Hello World'.length);
    });

    it('counts forms', () => {
      const doc = createDoc('<form><input></form><form><input></form>');
      const snap = new DixieSnapshot(doc);
      expect(snap.toSummary().formCount).toBe(2);
    });

    it('counts links', () => {
      const doc = createDoc('<a href="#">Link1</a><a href="#">Link2</a><a href="#">Link3</a>');
      const snap = new DixieSnapshot(doc);
      expect(snap.toSummary().linkCount).toBe(3);
    });

    it('counts headings', () => {
      const doc = createDoc('<h1>One</h1><h3>Three</h3>');
      const snap = new DixieSnapshot(doc);
      expect(snap.toSummary().headingCount).toBe(2);
    });

    it('hasContent is true when body has text', () => {
      const doc = createDoc('<p>Yes</p>');
      const snap = new DixieSnapshot(doc);
      expect(snap.toSummary().hasContent).toBe(true);
    });

    it('hasContent is false when body is empty', () => {
      const doc = new Document();
      const snap = new DixieSnapshot(doc);
      expect(snap.toSummary().hasContent).toBe(false);
    });
  });

  // ── Edge cases ──────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles empty document (no body content)', () => {
      const doc = new Document();
      const snap = new DixieSnapshot(doc);
      const state = snap.toJSON();
      expect(state.bodyHTML).toBe('');
      expect(state.bodyText).toBe('');
      expect(state.elementCount).toBe(0);
    });

    it('handles deeply nested structure', () => {
      let html = '';
      for (let i = 0; i < 10; i++) {
        html = `<div>${html}Level${i}</div>`;
      }
      const doc = createDoc(html);
      const snap = new DixieSnapshot(doc);
      const state = snap.toJSON();
      expect(state.elementCount).toBe(10);
    });

    it('form with no fields reports fieldCount 0', () => {
      const doc = createDoc('<form action="/empty"></form>');
      const snap = new DixieSnapshot(doc);
      const state = snap.toJSON();
      expect(state.forms).toHaveLength(1);
      expect(state.forms[0].fieldCount).toBe(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Barrel export check
// ═══════════════════════════════════════════════════════════════════════

describe('assertions barrel export', () => {
  it('exports DixieAssertions from index', async () => {
    const mod = await import('../src/assertions/index');
    expect(mod.DixieAssertions).toBeDefined();
  });

  it('exports DixieSnapshot from index', async () => {
    const mod = await import('../src/assertions/index');
    expect(mod.DixieSnapshot).toBeDefined();
  });
});
