/**
 * 508f.build.test.ts — Build & Package Validation
 *
 * AC 1: npx tsc --noEmit produces zero errors
 * AC 2: esbuild and js-yaml in devDependencies
 * AC 10: instanceof HTMLInputElement works correctly
 *
 * Tests go in dixie-standalone/tests/ during /do
 */
import { describe, it, expect } from 'vitest';

// ── AC 2: Package dependencies ─────────────────────────────────────
describe('package.json dependency placement', () => {
  it('esbuild must be in devDependencies, not dependencies', async () => {
    const pkg = await import('../package.json', { assert: { type: 'json' } });
    expect(pkg.default.dependencies?.esbuild).toBeUndefined();
    expect(typeof pkg.default.devDependencies?.esbuild).toBe('string');
  });

  it('js-yaml must be in devDependencies, not dependencies', async () => {
    const pkg = await import('../package.json', { assert: { type: 'json' } });
    expect(pkg.default.dependencies?.['js-yaml']).toBeUndefined();
    expect(typeof pkg.default.devDependencies?.['js-yaml']).toBe('string');
  });

  it('@types/node must be in devDependencies', async () => {
    const pkg = await import('../package.json', { assert: { type: 'json' } });
    expect(typeof pkg.default.devDependencies?.['@types/node']).toBe('string');
  });

  it('version must be 4.0.0', async () => {
    const pkg = await import('../package.json', { assert: { type: 'json' } });
    expect(pkg.default.version).toBe('4.0.0');
  });
});

// ── AC 1: TypeScript build (behavioral — protected field access fixed) ──
describe('protected field access fixes', () => {
  it('DixieSnapshot uses public childNodes, not _children', async () => {
    const { DixieSnapshot } = await import('../src/assertions');
    const { Document } = await import('../src/nodes/Document');
    const doc = new Document();
    const div = doc.createElement('div');
    div.innerHTML = '<p>Hello</p><p>World</p>';
    doc.body.appendChild(div);

    // This would throw if _children (protected) is still used
    const snapshot = new DixieSnapshot(doc);
    expect(snapshot).toBeInstanceOf(Object);
    const summary = snapshot.summary();
    expect(typeof summary).toBe('object');
  });

  it('DiffSnapshot detects added elements via static API', async () => {
    const { DiffSnapshot } = await import('../src/assertions');
    const { Document } = await import('../src/nodes/Document');
    const doc1 = new Document();
    doc1.body.innerHTML = '<p>Before</p>';

    const snap1 = DiffSnapshot.capture(doc1);

    // Mutate document
    doc1.body.innerHTML = '<p>Before</p><span>New</span>';

    const snap2 = DiffSnapshot.capture(doc1);
    const result = DiffSnapshot.diff(snap1, snap2);

    // Must detect the added <span> using DiffResult.entries
    expect(result.identical).toBe(false);
    expect(result.entries.length).toBeGreaterThan(0);
    // DiffEntry has { type, path, element, details? }
    const addedSpan = result.entries.find((e: any) => e.type === 'added' && e.element.includes('span'));
    expect(addedSpan).not.toBeUndefined();
  });

  it('DixieAssertions uses public childNodes, not _children', async () => {
    const { DixieAssertions } = await import('../src/assertions');
    const { Document } = await import('../src/nodes/Document');
    const doc = new Document();
    doc.body.innerHTML = '<button>Click me</button>';

    const assertions = new DixieAssertions(doc);
    // hasElement checks children via public API
    expect(assertions.hasElement('button')).toBe(true);
  });
});

// ── AC 10: instanceof correctness ──────────────────────────────────
describe('instanceof HTML element constructors', () => {
  it('createElement("input") instanceof HTMLInputElement must be true', async () => {
    const { createDixieEnvironment } = await import('../src/environment/DixieEnvironment');
    const { installGlobals } = await import('../src/environment/installGlobals');

    const env = createDixieEnvironment({ url: 'http://test.local/' });
    const { restore } = installGlobals(env);

    try {
      const input = env.document.createElement('input');
      // After v4, this must return true (not alias everything to Element)
      expect(input instanceof (globalThis as any).HTMLInputElement).toBe(true);
    } finally {
      restore();
    }
  });

  it('createElement("textarea") instanceof HTMLTextAreaElement must be true', async () => {
    const { createDixieEnvironment } = await import('../src/environment/DixieEnvironment');
    const { installGlobals } = await import('../src/environment/installGlobals');

    const env = createDixieEnvironment({ url: 'http://test.local/' });
    const { restore } = installGlobals(env);

    try {
      const ta = env.document.createElement('textarea');
      expect(ta instanceof (globalThis as any).HTMLTextAreaElement).toBe(true);
    } finally {
      restore();
    }
  });

  it('createElement("button") instanceof HTMLButtonElement must be true', async () => {
    const { createDixieEnvironment } = await import('../src/environment/DixieEnvironment');
    const { installGlobals } = await import('../src/environment/installGlobals');

    const env = createDixieEnvironment({ url: 'http://test.local/' });
    const { restore } = installGlobals(env);

    try {
      const btn = env.document.createElement('button');
      expect(btn instanceof (globalThis as any).HTMLButtonElement).toBe(true);
    } finally {
      restore();
    }
  });

  it('createElement("div") must NOT be instanceof HTMLInputElement', async () => {
    const { createDixieEnvironment } = await import('../src/environment/DixieEnvironment');
    const { installGlobals } = await import('../src/environment/installGlobals');

    const env = createDixieEnvironment({ url: 'http://test.local/' });
    const { restore } = installGlobals(env);

    try {
      const div = env.document.createElement('div');
      // With Element aliasing, this incorrectly returns true
      expect(div instanceof (globalThis as any).HTMLInputElement).toBe(false);
    } finally {
      restore();
    }
  });

  it('plain object with tagName must NOT pass instanceof (FLAW-008 fix)', async () => {
    const { createDixieEnvironment } = await import('../src/environment/DixieEnvironment');
    const { installGlobals } = await import('../src/environment/installGlobals');

    const env = createDixieEnvironment({ url: 'http://test.local/' });
    const { restore } = installGlobals(env);

    try {
      // Plain object with matching tagName must NOT pass instanceof
      const fakeInput = { tagName: 'INPUT', nodeType: 1 };
      expect(fakeInput instanceof (globalThis as any).HTMLInputElement).toBe(false);
    } finally {
      restore();
    }
  });

  it('createElement("select") instanceof HTMLSelectElement must be true', async () => {
    const { createDixieEnvironment } = await import('../src/environment/DixieEnvironment');
    const { installGlobals } = await import('../src/environment/installGlobals');

    const env = createDixieEnvironment({ url: 'http://test.local/' });
    const { restore } = installGlobals(env);

    try {
      const sel = env.document.createElement('select');
      expect(sel instanceof (globalThis as any).HTMLSelectElement).toBe(true);
    } finally {
      restore();
    }
  });

  it('createElement("form") instanceof HTMLFormElement must be true', async () => {
    const { createDixieEnvironment } = await import('../src/environment/DixieEnvironment');
    const { installGlobals } = await import('../src/environment/installGlobals');

    const env = createDixieEnvironment({ url: 'http://test.local/' });
    const { restore } = installGlobals(env);

    try {
      const form = env.document.createElement('form');
      expect(form instanceof (globalThis as any).HTMLFormElement).toBe(true);
    } finally {
      restore();
    }
  });
});
