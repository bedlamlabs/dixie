/**
 * Tests for the page collector — the default output for `dixie <url>`.
 * Verifies structured JSON includes title, text, links, headings, forms,
 * images, meta/OG, JSON-LD, and structure.
 */
import { describe, it, expect } from 'vitest';
import { Document } from '../src/nodes/Document';
import { collectPage } from '../src/collectors/page';

function docWithBody(html: string): any {
  const doc = new Document();
  doc.body.innerHTML = html;
  return doc;
}

function docWithHead(headHtml: string, bodyHtml: string): any {
  const doc = new Document();
  doc.head.innerHTML = headHtml;
  doc.body.innerHTML = bodyHtml;
  return doc;
}

const baseMeta = { url: 'http://test.local/', renderMs: 10, parseMs: 5 };

describe('collectPage', () => {
  it('returns all expected top-level fields', () => {
    const doc = docWithBody('<p>Hello</p>');
    const result = collectPage(doc, baseMeta, []);

    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('meta');
    expect(result).toHaveProperty('headings');
    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('links');
    expect(result).toHaveProperty('buttons');
    expect(result).toHaveProperty('forms');
    expect(result).toHaveProperty('images');
    expect(result).toHaveProperty('structure');
    expect(result).toHaveProperty('errors');
    expect(result).toHaveProperty('_meta');
  });

  it('extracts title', () => {
    const doc = docWithBody('<p>content</p>');
    doc.title = 'My Page Title';
    const result = collectPage(doc, baseMeta, []);
    expect(result.title).toBe('My Page Title');
  });

  it('extracts visible text', () => {
    const doc = docWithBody(`
      <h1>Heading</h1>
      <p>Paragraph text.</p>
      <script>var x = 1;</script>
    `);
    const result = collectPage(doc, baseMeta, []);
    expect(result.text).toContain('Heading');
    expect(result.text).toContain('Paragraph text.');
    expect(result.text).not.toContain('var x');
  });

  it('extracts headings with levels', () => {
    const doc = docWithBody(`
      <h1>Title</h1>
      <h2>Subtitle</h2>
      <h3>Section</h3>
    `);
    const result = collectPage(doc, baseMeta, []);
    expect(result.headings).toEqual([
      { level: 1, text: 'Title' },
      { level: 2, text: 'Subtitle' },
      { level: 3, text: 'Section' },
    ]);
  });

  it('extracts links with href and text', () => {
    const doc = docWithBody(`
      <a href="/about">About Us</a>
      <a href="https://external.com">External</a>
    `);
    const result = collectPage(doc, baseMeta, []);
    expect(result.links).toHaveLength(2);
    expect(result.links[0]).toEqual({ tag: 'a', href: '/about', text: 'About Us' });
  });

  it('extracts buttons', () => {
    const doc = docWithBody(`
      <button type="submit">Save</button>
      <button>Cancel</button>
    `);
    const result = collectPage(doc, baseMeta, []);
    expect(result.buttons).toHaveLength(2);
    expect(result.buttons[0]).toEqual({ text: 'Save', type: 'submit' });
  });

  it('extracts form fields', () => {
    const doc = docWithBody(`
      <form>
        <input type="email" required />
        <textarea></textarea>
        <select><option value="a">A</option></select>
      </form>
    `);
    const result = collectPage(doc, baseMeta, []);
    expect(result.forms.fields).toHaveLength(3);
    expect(result.forms.fields[0].type).toBe('email');
    expect(result.forms.fields[0].required).toBe(true);
  });

  it('extracts images with src and alt', () => {
    const doc = docWithBody(`
      <img src="/logo.png" alt="Logo" />
      <img src="/hero.jpg" />
    `);
    const result = collectPage(doc, baseMeta, []);
    expect(result.images).toHaveLength(2);
    expect(result.images[0]).toEqual({ src: '/logo.png', alt: 'Logo' });
    expect(result.images[1]).toEqual({ src: '/hero.jpg' });
  });

  it('skips images without src', () => {
    const doc = docWithBody('<img alt="broken" />');
    const result = collectPage(doc, baseMeta, []);
    expect(result.images).toHaveLength(0);
  });

  it('extracts meta description', () => {
    const doc = docWithHead(
      '<meta name="description" content="A test page" />',
      '<p>content</p>',
    );
    const result = collectPage(doc, baseMeta, []);
    expect(result.meta.description).toBe('A test page');
  });

  it('extracts OpenGraph tags', () => {
    const doc = docWithHead(
      `<meta property="og:title" content="OG Title" />
       <meta property="og:image" content="https://example.com/img.jpg" />`,
      '<p>content</p>',
    );
    const result = collectPage(doc, baseMeta, []);
    expect(result.meta.openGraph['og:title']).toBe('OG Title');
    expect(result.meta.openGraph['og:image']).toBe('https://example.com/img.jpg');
  });

  it('extracts JSON-LD structured data', () => {
    const doc = docWithBody(`
      <script type="application/ld+json">{"@type": "Organization", "name": "Test"}</script>
    `);
    const result = collectPage(doc, baseMeta, []);
    expect(result.meta.jsonLd).toHaveLength(1);
    expect((result.meta.jsonLd[0] as any)['@type']).toBe('Organization');
  });

  it('handles malformed JSON-LD gracefully', () => {
    const doc = docWithBody(`
      <script type="application/ld+json">{invalid json}</script>
    `);
    const result = collectPage(doc, baseMeta, []);
    expect(result.meta.jsonLd).toHaveLength(0);
  });

  it('includes structure with element count', () => {
    const doc = docWithBody(`
      <div><p>Text</p><span>More</span></div>
    `);
    const result = collectPage(doc, baseMeta, []);
    expect(result.structure.elementCount).toBeGreaterThanOrEqual(3);
    expect(result.structure.tree.tag).toBe('body');
  });

  it('passes through errors', () => {
    const doc = docWithBody('<p>ok</p>');
    const errors = [{ code: 'SCRIPT_ERROR', message: 'boom' }];
    const result = collectPage(doc, baseMeta, errors);
    expect(result.errors).toEqual(errors);
  });

  it('includes _meta with timing', () => {
    const doc = docWithBody('<p>ok</p>');
    const result = collectPage(doc, { url: 'http://test.local/', renderMs: 12.5, parseMs: 3.2 }, []);
    expect(result._meta.renderMs).toBe(12.5);
    expect(result._meta.parseMs).toBe(3.2);
  });

  it('output is JSON-serializable', () => {
    const doc = docWithHead(
      '<meta name="description" content="Test" />',
      `<h1>Title</h1>
       <p>Body text</p>
       <a href="/link">Link</a>
       <img src="/img.png" alt="Img" />
       <form><input type="text" /></form>
       <script type="application/ld+json">{"@type": "WebPage"}</script>`,
    );
    doc.title = 'Test Page';
    const result = collectPage(doc, baseMeta, []);
    const json = JSON.stringify(result);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});
