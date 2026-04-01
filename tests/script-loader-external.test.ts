/**
 * Tests for the rewritten script loader — inline + external scripts,
 * parallel fetch, ordered execution, async/defer semantics.
 */
import { describe, it, expect } from 'vitest';
import { Document } from '../src/nodes/Document';
import { createVmContext } from '../src/execution/vm-context';
import { loadScripts } from '../src/execution/script-loader';

// Helper: create a VM context with a document containing given HTML body
function ctxWithBody(bodyHtml: string) {
  const ctx = createVmContext({ url: 'http://test.local/', enableFetch: false });
  ctx.document.body.innerHTML = bodyHtml;
  return ctx;
}

describe('script loader — inline scripts', () => {
  it('executes inline scripts in document order', async () => {
    const ctx = ctxWithBody(`
      <script>window._order = []; window._order.push('a');</script>
      <script>window._order.push('b');</script>
      <script>window._order.push('c');</script>
    `);

    const result = await loadScripts(ctx);

    expect(result.executed).toBe(3);
    expect(result.failed).toBe(0);
    expect(ctx.window._order).toEqual(['a', 'b', 'c']);
  });

  it('skips non-JS script types', async () => {
    const ctx = ctxWithBody(`
      <script type="application/json">{"key": "value"}</script>
      <script type="application/ld+json">{"@context": "schema.org"}</script>
      <script>window._ran = true;</script>
    `);

    const result = await loadScripts(ctx);

    expect(result.executed).toBe(1);
    expect(result.skipped).toBe(2);
    expect(ctx.window._ran).toBe(true);
  });

  it('skips empty inline scripts', async () => {
    const ctx = ctxWithBody(`
      <script></script>
      <script>   </script>
      <script>window._ran = true;</script>
    `);

    const result = await loadScripts(ctx);

    expect(result.executed).toBe(1);
    expect(result.skipped).toBe(2);
  });

  it('reports errors from inline scripts without crashing', async () => {
    const ctx = ctxWithBody(`
      <script>window._before = true;</script>
      <script>throw new Error('boom');</script>
      <script>window._after = true;</script>
    `);

    const result = await loadScripts(ctx);

    expect(result.executed).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.errors[0].error).toContain('boom');
    expect(ctx.window._before).toBe(true);
    expect(ctx.window._after).toBe(true);
  });

  it('returns zero-result for empty documents', async () => {
    const ctx = ctxWithBody('<div>No scripts here</div>');
    const result = await loadScripts(ctx);

    expect(result.executed).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.skipped).toBe(0);
  });
});

describe('script loader — external scripts', () => {
  // Mock fetchFn that returns predefined script content
  function mockFetch(scripts: Record<string, string>) {
    return async (url: string): Promise<string> => {
      const content = scripts[url];
      if (content === undefined) {
        throw new Error(`404: ${url}`);
      }
      return content;
    };
  }

  it('fetches and executes external scripts', async () => {
    const ctx = ctxWithBody(`
      <script src="http://test.local/app.js"></script>
    `);

    const result = await loadScripts(ctx, {
      fetchFn: mockFetch({
        'http://test.local/app.js': 'window._loaded = "app";',
      }),
    });

    expect(result.executed).toBe(1);
    expect(ctx.window._loaded).toBe('app');
  });

  it('executes inline and external scripts in document order', async () => {
    const ctx = ctxWithBody(`
      <script>window._order = []; window._order.push('inline-1');</script>
      <script src="http://test.local/ext.js"></script>
      <script>window._order.push('inline-2');</script>
    `);

    const result = await loadScripts(ctx, {
      fetchFn: mockFetch({
        'http://test.local/ext.js': 'window._order.push("external");',
      }),
    });

    expect(result.executed).toBe(3);
    expect(ctx.window._order).toEqual(['inline-1', 'external', 'inline-2']);
  });

  it('handles fetch failures gracefully', async () => {
    const ctx = ctxWithBody(`
      <script src="http://test.local/missing.js"></script>
      <script>window._afterMissing = true;</script>
    `);

    const result = await loadScripts(ctx, {
      fetchFn: mockFetch({}), // No scripts registered — all will 404
    });

    expect(result.executed).toBe(1); // inline still runs
    expect(result.failed).toBe(1);
    expect(result.errors[0].src).toBe('http://test.local/missing.js');
    expect(ctx.window._afterMissing).toBe(true);
  });

  it('deferred scripts execute after sync scripts', async () => {
    const ctx = ctxWithBody(`
      <script defer src="http://test.local/deferred.js"></script>
      <script>window._order = []; window._order.push('sync');</script>
    `);

    const result = await loadScripts(ctx, {
      fetchFn: mockFetch({
        'http://test.local/deferred.js': 'window._order.push("deferred");',
      }),
    });

    expect(result.executed).toBe(2);
    expect(ctx.window._order).toEqual(['sync', 'deferred']);
  });

  it('async scripts execute with sync scripts in document order', async () => {
    const ctx = ctxWithBody(`
      <script>window._order = []; window._order.push('first');</script>
      <script async src="http://test.local/async.js"></script>
      <script>window._order.push('last');</script>
    `);

    const result = await loadScripts(ctx, {
      fetchFn: mockFetch({
        'http://test.local/async.js': 'window._order.push("async");',
      }),
    });

    expect(result.executed).toBe(3);
    // In our implementation, async scripts are fetched in parallel but
    // executed in document order during Phase 3
    expect(ctx.window._order).toEqual(['first', 'async', 'last']);
  });

  it('resolves relative script URLs against page URL', async () => {
    const ctx = createVmContext({ url: 'https://example.com/page/index.html', enableFetch: false });
    ctx.document.body.innerHTML = `<script src="/js/app.js"></script>`;

    const fetchedUrls: string[] = [];
    const result = await loadScripts(ctx, {
      fetchFn: async (url: string) => {
        fetchedUrls.push(url);
        return 'window._resolved = true;';
      },
    });

    expect(fetchedUrls).toEqual(['https://example.com/js/app.js']);
    expect(result.executed).toBe(1);
    expect(ctx.window._resolved).toBe(true);
  });

  it('handles type="module" scripts (executes if vm.SourceTextModule available, skips otherwise)', async () => {
    const ctx = ctxWithBody(`
      <script type="module" src="http://test.local/mod.mjs"></script>
      <script>window._ran = true;</script>
    `);

    const result = await loadScripts(ctx, {
      fetchFn: mockFetch({
        'http://test.local/mod.mjs': 'globalThis._module = true;',
      }),
    });

    // Classic script always runs
    expect(ctx.window._ran).toBe(true);

    // Module either executes or is skipped depending on Node.js capabilities
    const totalHandled = result.executed + result.skipped;
    expect(totalHandled).toBe(2);
    expect(result.failed).toBe(0);
  });

  it('falls back to inline-only when no fetchFn and no liveFetch', async () => {
    const ctx = ctxWithBody(`
      <script src="http://test.local/ext.js"></script>
      <script>window._inline = true;</script>
    `);
    // enableFetch is false and no fetchFn provided
    const result = await loadScripts(ctx);

    expect(result.executed).toBe(1); // only inline
    expect(result.skipped).toBe(1); // external skipped
    expect(ctx.window._inline).toBe(true);
  });
});

describe('script loader — execution errors in external scripts', () => {
  it('reports runtime errors from external scripts', async () => {
    const ctx = ctxWithBody(`
      <script src="http://test.local/bad.js"></script>
    `);

    const result = await loadScripts(ctx, {
      fetchFn: async () => 'throw new Error("runtime boom");',
    });

    expect(result.failed).toBe(1);
    expect(result.errors[0].error).toContain('runtime boom');
  });

  it('calls onScriptError callback on fetch failure', async () => {
    const ctx = ctxWithBody(`
      <script src="http://test.local/missing.js"></script>
    `);

    const errors: Array<{ src: string; err: Error }> = [];
    await loadScripts(ctx, {
      fetchFn: async () => { throw new Error('network error'); },
      onScriptError: (src, err) => errors.push({ src, err }),
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].src).toBe('http://test.local/missing.js');
    expect(errors[0].err.message).toBe('network error');
  });
});
