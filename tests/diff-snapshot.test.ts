import { describe, it, expect } from 'vitest';
import { Document } from '../src/nodes/Document';
import { DiffSnapshot } from '../src/assertions/DiffSnapshot';
import type { SnapshotData } from '../src/assertions/DiffSnapshot';

// ── Helpers ───────────────────────────────────────────────────────────

function createDoc(bodyHTML: string = ''): Document {
  const doc = new Document();
  if (bodyHTML) {
    doc.body.innerHTML = bodyHTML;
  }
  return doc;
}

// ═══════════════════════════════════════════════════════════════════════
// DiffSnapshot
// ═══════════════════════════════════════════════════════════════════════

describe('DiffSnapshot', () => {
  // ── capture() ─────────────────────────────────────────────────────

  describe('capture()', () => {
    it('creates snapshot with tree structure', () => {
      const doc = createDoc('<div><p>Hello</p></div>');
      const snapshot = DiffSnapshot.capture(doc);

      expect(snapshot).toBeDefined();
      expect(snapshot.timestamp).toBeTypeOf('number');
      expect(snapshot.tree).toBeInstanceOf(Array);
      expect(snapshot.tree.length).toBe(1); // html root
      expect(snapshot.tree[0].tag).toBe('html');
    });

    it('records tag, id, classes, attributes', () => {
      const doc = createDoc('<div id="app" class="container main" role="main"><span>text</span></div>');
      const snapshot = DiffSnapshot.capture(doc);

      // Navigate to the div: html > body > div
      const html = snapshot.tree[0];
      const body = html.children!.find(c => c.tag === 'body')!;
      const div = body.children![0];

      expect(div.tag).toBe('div');
      expect(div.id).toBe('app');
      expect(div.classes).toContain('container');
      expect(div.classes).toContain('main');
      expect(div.attributes?.role).toBe('main');
    });

    it('records text content', () => {
      const doc = createDoc('<p>Hello World</p>');
      const snapshot = DiffSnapshot.capture(doc);

      const html = snapshot.tree[0];
      const body = html.children!.find(c => c.tag === 'body')!;
      const p = body.children![0];

      expect(p.text).toBe('Hello World');
    });

    it('generates CSS-like paths', () => {
      const doc = createDoc('<div id="app"><section><p>Deep</p></section></div>');
      const snapshot = DiffSnapshot.capture(doc);

      const html = snapshot.tree[0];
      expect(html.path).toBe('html');

      const body = html.children!.find(c => c.tag === 'body')!;
      expect(body.path).toContain('body');

      const div = body.children![0];
      expect(div.path).toContain('div#app');

      const section = div.children![0];
      expect(section.path).toContain('section');

      const p = section.children![0];
      expect(p.path).toContain('p');
    });
  });

  // ── diff() ────────────────────────────────────────────────────────

  describe('diff()', () => {
    it('returns identical:true for same DOM', () => {
      const doc = createDoc('<div><p>Hello</p></div>');
      const snap1 = DiffSnapshot.capture(doc);
      const snap2 = DiffSnapshot.capture(doc);

      const result = DiffSnapshot.diff(snap1, snap2);

      expect(result.identical).toBe(true);
      expect(result.entries).toHaveLength(0);
      expect(result.summary).toBe('No changes detected');
    });

    it('detects added elements', () => {
      const doc = createDoc('<div></div>');
      const before = DiffSnapshot.capture(doc);

      doc.body.innerHTML = '<div><p>New paragraph</p></div>';
      const after = DiffSnapshot.capture(doc);

      const result = DiffSnapshot.diff(before, after);

      expect(result.identical).toBe(false);
      const addedEntries = result.entries.filter(e => e.type === 'added');
      expect(addedEntries.length).toBeGreaterThan(0);
      expect(result.stats.added).toBeGreaterThan(0);
    });

    it('detects removed elements', () => {
      const doc = createDoc('<div><p>Will be removed</p><span>Also removed</span></div>');
      const before = DiffSnapshot.capture(doc);

      doc.body.innerHTML = '<div></div>';
      const after = DiffSnapshot.capture(doc);

      const result = DiffSnapshot.diff(before, after);

      expect(result.identical).toBe(false);
      const removedEntries = result.entries.filter(e => e.type === 'removed');
      expect(removedEntries.length).toBeGreaterThan(0);
      expect(result.stats.removed).toBeGreaterThan(0);
    });

    it('detects changed text content', () => {
      const doc = createDoc('<p>Old text</p>');
      const before = DiffSnapshot.capture(doc);

      doc.body.innerHTML = '<p>New text</p>';
      const after = DiffSnapshot.capture(doc);

      const result = DiffSnapshot.diff(before, after);

      expect(result.identical).toBe(false);
      const changedEntries = result.entries.filter(e => e.type === 'changed');
      expect(changedEntries.length).toBeGreaterThan(0);

      const textChange = changedEntries.find(e => e.details?.includes('text:'));
      expect(textChange).toBeDefined();
      expect(textChange!.details).toContain('Old text');
      expect(textChange!.details).toContain('New text');
    });

    it('detects changed attributes', () => {
      const doc = createDoc('<a href="/old">Link</a>');
      const before = DiffSnapshot.capture(doc);

      doc.body.innerHTML = '<a href="/new">Link</a>';
      const after = DiffSnapshot.capture(doc);

      const result = DiffSnapshot.diff(before, after);

      expect(result.identical).toBe(false);
      const changedEntries = result.entries.filter(e => e.type === 'changed');
      expect(changedEntries.length).toBeGreaterThan(0);

      const attrChange = changedEntries.find(e => e.details?.includes('href'));
      expect(attrChange).toBeDefined();
      expect(attrChange!.details).toContain('/old');
      expect(attrChange!.details).toContain('/new');
    });

    it('detects changed classes', () => {
      const doc = createDoc('<div class="active primary"></div>');
      const before = DiffSnapshot.capture(doc);

      doc.body.innerHTML = '<div class="inactive secondary"></div>';
      const after = DiffSnapshot.capture(doc);

      const result = DiffSnapshot.diff(before, after);

      expect(result.identical).toBe(false);
      const changedEntries = result.entries.filter(e => e.type === 'changed');
      const classChange = changedEntries.find(e => e.details?.includes('classes:'));
      expect(classChange).toBeDefined();
    });

    it('generates accurate summary', () => {
      const doc = createDoc('<div><p>Text</p></div>');
      const before = DiffSnapshot.capture(doc);

      doc.body.innerHTML = '<div><p>Changed</p><span>Added</span></div>';
      const after = DiffSnapshot.capture(doc);

      const result = DiffSnapshot.diff(before, after);

      expect(result.summary).toBeTruthy();
      expect(result.summary).not.toBe('No changes detected');
      // Summary should mention added and/or changed
      expect(result.summary.length).toBeGreaterThan(0);
    });

    it('stats count correctly', () => {
      const doc = createDoc('<div><p>One</p><span>Two</span></div>');
      const before = DiffSnapshot.capture(doc);

      // Remove span, change p text, add section
      doc.body.innerHTML = '<div><p>Modified</p><section>New</section></div>';
      const after = DiffSnapshot.capture(doc);

      const result = DiffSnapshot.diff(before, after);

      expect(result.stats.total).toBe(
        result.stats.added + result.stats.removed + result.stats.changed + result.stats.moved
      );
      expect(result.stats.total).toBe(result.entries.length);
    });
  });

  // ── diffFrom() ────────────────────────────────────────────────────

  describe('diffFrom()', () => {
    it('compares current DOM against snapshot', () => {
      const doc = createDoc('<p>Before</p>');
      const snapshot = DiffSnapshot.capture(doc);

      doc.body.innerHTML = '<p>After</p>';
      const result = DiffSnapshot.diffFrom(doc, snapshot);

      expect(result.identical).toBe(false);
      expect(result.entries.length).toBeGreaterThan(0);
    });
  });

  // ── track() ───────────────────────────────────────────────────────

  describe('track()', () => {
    it('captures before/after and returns diff', () => {
      const doc = createDoc('<div></div>');

      const { diff } = DiffSnapshot.track(doc, () => {
        doc.body.innerHTML = '<div><p>Added by function</p></div>';
      });

      expect(diff.identical).toBe(false);
      const addedEntries = diff.entries.filter(e => e.type === 'added');
      expect(addedEntries.length).toBeGreaterThan(0);
    });

    it('returns function result alongside diff', () => {
      const doc = createDoc('<div></div>');

      const { result, diff } = DiffSnapshot.track(doc, () => {
        doc.body.innerHTML = '<div><p>Hello</p></div>';
        return 42;
      });

      expect(result).toBe(42);
      expect(diff).toBeDefined();
      expect(diff.identical).toBe(false);
    });
  });

  // ── trackAsync() ──────────────────────────────────────────────────

  describe('trackAsync()', () => {
    it('works with async operations', async () => {
      const doc = createDoc('<div></div>');

      const { result, diff } = await DiffSnapshot.trackAsync(doc, async () => {
        await new Promise(resolve => setTimeout(resolve, 1));
        doc.body.innerHTML = '<div><p>Async content</p></div>';
        return 'done';
      });

      expect(result).toBe('done');
      expect(diff.identical).toBe(false);
    });
  });

  // ── Complex scenarios ─────────────────────────────────────────────

  describe('Complex scenarios', () => {
    it('add, remove, and change in one diff', () => {
      const doc = createDoc('<div><p>Keep</p><span>Remove me</span></div>');
      const before = DiffSnapshot.capture(doc);

      doc.body.innerHTML = '<div><p>Changed</p><section>New element</section></div>';
      const after = DiffSnapshot.capture(doc);

      const result = DiffSnapshot.diff(before, after);

      expect(result.identical).toBe(false);
      expect(result.stats.total).toBeGreaterThan(0);
      // Should have changes (p text changed) and removals (span) and additions (section)
      // The span→section swap will show as removed + added since tags differ
    });

    it('nested changes detected correctly', () => {
      const doc = createDoc('<div><ul><li>Item 1</li><li>Item 2</li></ul></div>');
      const before = DiffSnapshot.capture(doc);

      doc.body.innerHTML = '<div><ul><li>Item 1 modified</li><li>Item 2</li><li>Item 3</li></ul></div>';
      const after = DiffSnapshot.capture(doc);

      const result = DiffSnapshot.diff(before, after);

      expect(result.identical).toBe(false);
      // Item 1 text changed, Item 3 added
      expect(result.entries.length).toBeGreaterThan(0);
    });

    it('path accuracy for deeply nested elements', () => {
      const doc = createDoc('<div id="root"><main><article><section><p>Deep</p></section></article></main></div>');
      const snapshot = DiffSnapshot.capture(doc);

      // Navigate through the tree and verify paths are hierarchical
      const html = snapshot.tree[0];
      const body = html.children!.find(c => c.tag === 'body')!;
      const div = body.children![0];
      const main = div.children![0];
      const article = main.children![0];
      const section = article.children![0];
      const p = section.children![0];

      // Each path should contain parent path info
      expect(div.path).toContain('div#root');
      expect(main.path).toContain('main');
      expect(article.path).toContain('article');
      expect(section.path).toContain('section');
      expect(p.path).toContain('p');

      // Deeper paths should be longer (more segments)
      expect(p.path.length).toBeGreaterThan(div.path.length);
    });
  });
});
