/**
 * Triage 2026-03-10 — RED tests for 10 issues found by Codex second-pass
 * on the 0.8170 OSS release artifact.
 *
 * Issue 11 (removeChild MutationObserver) was a false positive — already wired.
 */

import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import path from 'node:path';

// ── #1 — bin/ directory missing ─────────────────────────────────────────────

describe('Issue #1: bin/dixie.ts must exist', () => {
  it('packages/dixie/bin/dixie.ts is present', () => {
    const binPath = path.resolve(import.meta.dirname, '../bin/dixie.ts');
    expect(existsSync(binPath)).toBe(true);
  });
});

// ── #2 — run.execute() reads args.url instead of args.file ──────────────────

describe('Issue #2: run command accepts file path via args.file', () => {
  it('execute with args.file set and args.url undefined does not return MISSING_FILE', async () => {
    const { execute } = await import('./cli/commands/run');
    const args: any = {
      command: 'run',
      file: '/nonexistent/path/smoke.ts', // file set, not url
      url: undefined,
      format: 'json',
      timeout: 5000,
      noJs: false,
      parallel: false,
      verbose: false,
      bail: false,
      noColor: false,
      selectorStrategy: 'css',
      rest: [],
    };
    const result = await execute(args);
    // Should fail with ENOENT (file not found), NOT MISSING_FILE
    // MISSING_FILE means execute() never read args.file — bug is still present
    expect(result.errors?.[0]?.code).not.toBe('MISSING_FILE');
  });
});

// ── #3 — diff positional args mis-routed to selector ────────────────────────

describe('Issue #3: parseArgs routes diff positionals to rest', () => {
  it('dixie diff a.json b.json → rest[0]=a.json, rest[1]=b.json', async () => {
    const { parseArgs } = await import('./cli/index');
    const args = parseArgs(['diff', 'before.json', 'after.json']);
    expect(args.rest[0]).toBe('before.json');
    expect(args.rest[1]).toBe('after.json');
  });

  it('diff execute with correct rest produces a result not MISSING_ARGS', async () => {
    const { execute } = await import('./cli/commands/diff');
    const args: any = {
      command: 'diff',
      rest: ['before.json', 'after.json'],
      format: 'json',
      timeout: 5000,
      noJs: false,
      parallel: false,
      verbose: false,
      bail: false,
      noColor: false,
      selectorStrategy: 'css',
    };
    const result = await execute(args);
    // Will fail with ENOENT (files don't exist), NOT MISSING_ARGS
    // MISSING_ARGS means diff.execute() is still reading from the wrong positional
    expect(result.errors?.[0]?.code).not.toBe('MISSING_ARGS');
  });
});

// ── #4 — query.execute() never calls formatOutput ───────────────────────────

describe('Issue #4: query command respects --format flag', () => {
  it('query with --format yaml returns output field', async () => {
    const { execute } = await import('./cli/commands/query');
    const args: any = {
      command: 'query',
      url: 'data:text/html,<p>hello</p>',
      selector: 'p',
      format: 'yaml',
      timeout: 5000,
      noJs: false,
      parallel: false,
      verbose: false,
      bail: false,
      noColor: false,
      selectorStrategy: 'css',
      rest: [],
    };
    const result = await execute(args);
    expect(result.exitCode).toBe(0);
    // output field must be present and must be a string (YAML-formatted)
    expect(result.output).toBeDefined();
    expect(typeof result.output).toBe('string');
  });

  it('query text-search with --format yaml returns output field', async () => {
    const { execute } = await import('./cli/commands/query');
    const args: any = {
      command: 'query',
      url: 'data:text/html,<p>hello world</p>',
      text: 'hello',
      format: 'yaml',
      timeout: 5000,
      noJs: false,
      parallel: false,
      verbose: false,
      bail: false,
      noColor: false,
      selectorStrategy: 'css',
      rest: [],
    };
    const result = await execute(args);
    expect(result.output).toBeDefined();
    expect(typeof result.output).toBe('string');
  });
});

// ── #5 — VmContext sandbox.fetch not wired to HarRecorder ───────────────────

describe('Issue #5: VmContext records in-page fetch() calls when harRecorder provided', () => {
  it('createVmContext accepts harRecorder option', async () => {
    const { createVmContext } = await import('./execution/vm-context');
    const { HarRecorder } = await import('./har/recorder');
    const recorder = new HarRecorder();
    // This will fail to compile/type-check until VmContextOptions adds harRecorder
    const ctx = createVmContext({ url: 'http://localhost/', harRecorder: recorder } as any);
    expect(ctx).toBeDefined();
    expect(ctx.mockFetch).toBeDefined();
  });

  it('in-page fetch() calls are captured by harRecorder', async () => {
    const { createVmContext } = await import('./execution/vm-context');
    const { HarRecorder } = await import('./har/recorder');
    const recorder = new HarRecorder();
    const ctx = createVmContext({ url: 'http://localhost/', harRecorder: recorder } as any);

    // Register a mock route so MockFetch can respond
    ctx.mockFetch.register('http://api.test/data', {
      status: 200,
      body: JSON.stringify({ ok: true }),
      headers: { 'content-type': 'application/json' },
    });

    // Execute a fetch inside the vm
    ctx.executeScript(`
      fetch('http://api.test/data').then(r => r.json());
    `);

    // Allow the promise to settle
    await new Promise(resolve => setTimeout(resolve, 50));

    // When harRecorder is wired, in-page fetches should be recorded
    expect(recorder.getEntries().length).toBeGreaterThan(0);
  });
});

// ── #6 — NodeIterator._flattenTree() called per nextNode() ──────────────────

describe('Issue #6: NodeIterator returns correct nodes (O(n²) cache fix)', () => {
  it('iterates all descendant nodes in document order', async () => {
    const { Document } = await import('./nodes/Document');
    const doc = new Document();
    doc.body.innerHTML = '<div><p>a</p><span>b</span></div>';
    const iter = doc.createNodeIterator(doc.body);
    const tags: string[] = [];
    let node = iter.nextNode();
    while (node) {
      if ('tagName' in node) tags.push((node as any).tagName);
      node = iter.nextNode();
    }
    // body → div → p → span (in document order)
    expect(tags).toContain('DIV');
    expect(tags).toContain('P');
    expect(tags).toContain('SPAN');
    expect(tags.indexOf('DIV')).toBeLessThan(tags.indexOf('P'));
    expect(tags.indexOf('P')).toBeLessThan(tags.indexOf('SPAN'));
  });
});

// ── #7 — _fastQueryFirst char code range includes non-alpha ASCII ────────────

describe('Issue #7: _fastQueryFirst/All char range excludes 91-96', () => {
  it('querySelectorAll with underscore-start selector does not incorrectly match', async () => {
    const { Document } = await import('./nodes/Document');
    const doc = new Document();
    doc.body.innerHTML = '<div class="_container">hello</div>';
    // '_container' as a TAG selector (ch=95 '_') — should return [] since no <_container> elements
    // The fast path must NOT incorrectly match div because char 95 is in the buggy range
    const result = Array.from(doc.querySelectorAll('_container'));
    expect(result).toHaveLength(0);
  });

  it('querySelectorAll with standard tag still works after range fix', async () => {
    const { Document } = await import('./nodes/Document');
    const doc = new Document();
    doc.body.innerHTML = '<div><span>test</span></div>';
    const divs = Array.from(doc.querySelectorAll('div'));
    const spans = Array.from(doc.querySelectorAll('span'));
    expect(divs).toHaveLength(1);
    expect(spans).toHaveLength(1);
  });
});

// ── #8 — SelectorParser rejects unquoted numeric attribute values ────────────

describe('Issue #8: unquoted numeric attribute values in selectors', () => {
  it('[data-index=1] does not throw SyntaxError', async () => {
    const { Document } = await import('./nodes/Document');
    const doc = new Document();
    doc.body.innerHTML = '<li data-index="1">first</li><li data-index="2">second</li>';
    expect(() => doc.querySelectorAll('[data-index=1]')).not.toThrow();
  });

  it('[data-index=1] matches the element with that attribute value', async () => {
    const { Document } = await import('./nodes/Document');
    const doc = new Document();
    doc.body.innerHTML = '<li data-index="1">first</li><li data-index="2">second</li>';
    const result = Array.from(doc.querySelectorAll('[data-index=1]'));
    expect(result).toHaveLength(1);
    expect((result[0] as any).textContent).toBe('first');
  });
});

// ── #9 — ConsoleCapture singleton documented ─────────────────────────────────

describe('Issue #9: ConsoleCapture singleton behavior is known', () => {
  it('second install() replaces first instance (documented singleton semantics)', async () => {
    const { ConsoleCapture } = await import('./console/ConsoleCapture');
    const c1 = new ConsoleCapture();
    const c2 = new ConsoleCapture();
    c1.install();
    c2.install();
    // After c2.install(), c1 is effectively uninstalled — singleton allows only one active
    // Use console.error (always captured, no captureLog:true needed)
    console.error('captured by c2');
    const entries2 = c2.getErrors();
    c2.uninstall();
    expect(entries2.length).toBeGreaterThan(0);
    // c1 did NOT capture the error (singleton replaced it)
    const entries1 = c1.getErrors();
    c1.uninstall();
    // This documents the known behavior — JSDoc must warn parallel use is unsafe
    expect(entries1.length).toBe(0);
  });
});

// ── #10 — redact.ts bearer-value redaction undocumented ─────────────────────

describe('Issue #10: redactHeaders bearer-value behavior is documented', () => {
  it('any header whose value starts with Bearer is redacted regardless of name', async () => {
    const { redactHeaders } = await import('./redact');
    const result = redactHeaders({
      'X-Debug': 'Bearer abc123',           // non-auth header, bearer value
      'X-Custom': 'not-a-bearer-token',
      'Authorization': 'Bearer real-token',
    });
    // All three cases documented:
    expect(result!['X-Debug']).toBe('[REDACTED]');         // value-based redaction
    expect(result!['X-Custom']).toBe('not-a-bearer-token'); // not redacted
    expect(result!['Authorization']).toBe('[REDACTED]');   // header-name redaction
  });
});

// ── #12 — mock-record/mock-replay/snapshot missing behavioral tests ───────────

describe('Issue #12: mock-record smoke test', () => {
  it('execute with valid data: URL returns exitCode 0 and entries array', async () => {
    const { execute } = await import('./cli/commands/mock-record');
    const result = await execute({
      command: 'mock-record',
      url: 'data:text/html,<h1>test</h1>',
      format: 'json',
      timeout: 5000,
      noJs: true,
      parallel: false, verbose: false, bail: false, noColor: false,
      selectorStrategy: 'css', rest: [],
    } as any);
    expect(result.exitCode).toBe(0);
    expect(result.data).toHaveProperty('entries');
    expect(Array.isArray(result.data.entries)).toBe(true);
  });
});

describe('Issue #12: mock-replay smoke test', () => {
  it('execute with data: URL and empty HAR returns exitCode 0 and elementCount', async () => {
    const { execute } = await import('./cli/commands/mock-replay');
    const result = await execute({
      command: 'mock-replay',
      url: 'data:text/html,<p>replayed</p>',
      format: 'json',
      timeout: 5000,
      noJs: true,
      parallel: false, verbose: false, bail: false, noColor: false,
      selectorStrategy: 'css', rest: [],
      _harData: [],
    } as any);
    expect(result.exitCode).toBe(0);
    expect(result.data).toHaveProperty('elementCount');
    expect(result.data.elementCount).toBeGreaterThan(0);
  });
});

describe('Issue #12: snapshot smoke test', () => {
  it('execute with data: URL returns exitCode 0 with dom.structureHash', async () => {
    const { execute } = await import('./cli/commands/snapshot');
    const result = await execute({
      command: 'snapshot',
      url: 'data:text/html,<div><p>snap</p></div>',
      format: 'json',
      timeout: 5000,
      noJs: true,
      parallel: false, verbose: false, bail: false, noColor: false,
      selectorStrategy: 'css', rest: [],
    } as any);
    expect(result.exitCode).toBe(0);
    expect(result.data?.dom?.structureHash).toBeDefined();
    expect(typeof result.data.dom.structureHash).toBe('string');
    expect(result.data.dom.structureHash.length).toBeGreaterThan(0);
  });
});
