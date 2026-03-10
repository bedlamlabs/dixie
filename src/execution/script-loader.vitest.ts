/**
 * Unit tests for the script-loader external-script fetching feature
 * and the React render flush mechanism.
 *
 * Tests use a mock fetch to avoid network calls.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadScripts } from './script-loader';
import { flushReactRender } from './event-loop-flush';
import { createVmContext } from './vm-context';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeCtx(html: string) {
  const ctx = createVmContext({ timeout: 2000, url: 'http://localhost:5001/app/test' });
  ctx.document.body.innerHTML = html;
  return ctx;
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('script-loader: external scripts', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('fetches and executes a plain <script src> tag', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('window.__loaded = true;'),
    } as any);

    const ctx = makeCtx('<script src="/js/app.js"></script>');
    const errors = await loadScripts(ctx, { baseUrl: 'http://localhost:5001/app/test' });

    expect(errors.filter(e => e.code !== 'SCRIPT_EXEC_ERROR')).toHaveLength(0);
    expect(ctx.window.__loaded).toBe(true);
  });

  it('resolves relative src URLs against the base URL', async () => {
    let fetchedUrl = '';
    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      fetchedUrl = url;
      return { ok: true, text: () => Promise.resolve('') } as any;
    });

    const ctx = makeCtx('<script src="/assets/vendor.js"></script>');
    await loadScripts(ctx, { baseUrl: 'http://localhost:5001/app/test' });

    expect(fetchedUrl).toBe('http://localhost:5001/assets/vendor.js');
  });

  it('forwards auth token in fetch headers', async () => {
    let capturedHeaders: Record<string, string> = {};
    globalThis.fetch = vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
      capturedHeaders = Object.fromEntries(
        Object.entries((init?.headers as Record<string, string>) ?? {}),
      );
      return { ok: true, text: () => Promise.resolve('') } as any;
    });

    const ctx = makeCtx('<script src="/js/app.js"></script>');
    await loadScripts(ctx, {
      baseUrl: 'http://localhost:5001/',
      token: 'test-jwt-token',
    });

    expect(capturedHeaders['Authorization']).toBe('Bearer test-jwt-token');
  });

  it('captures HTTP error as SCRIPT_HTTP_ERROR without crashing', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve('Not Found'),
    } as any);

    const ctx = makeCtx('<script src="/missing.js"></script>');
    const errors = await loadScripts(ctx, { baseUrl: 'http://localhost:5001/' });

    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe('SCRIPT_HTTP_ERROR');
    expect(errors[0].message).toContain('404');
  });

  it('captures network error as SCRIPT_FETCH_ERROR without crashing', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

    const ctx = makeCtx('<script src="/js/app.js"></script>');
    const errors = await loadScripts(ctx, { baseUrl: 'http://localhost:5001/' });

    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe('SCRIPT_FETCH_ERROR');
  });

  it('skips src loading when --no-js would have already cleared scripts', async () => {
    // The --no-js path in render.ts removes script tags before calling loadScripts.
    // If somehow called with no scripts, loadScripts returns empty errors.
    globalThis.fetch = vi.fn();

    const ctx = makeCtx('<div>no scripts</div>');
    const errors = await loadScripts(ctx, { baseUrl: 'http://localhost:5001/' });

    expect(errors).toHaveLength(0);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('skips non-JS script types (application/json)', async () => {
    globalThis.fetch = vi.fn();

    const ctx = makeCtx('<script type="application/json" src="/data.json"></script>');
    const errors = await loadScripts(ctx, { baseUrl: 'http://localhost:5001/' });

    expect(errors).toHaveLength(0);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('stops loading when deadline is exceeded', async () => {
    globalThis.fetch = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 5000)),
    );

    const ctx = makeCtx('<script src="/slow.js"></script><script src="/slow2.js"></script>');
    const pastDeadline = Date.now() - 1; // already expired
    const errors = await loadScripts(ctx, {
      baseUrl: 'http://localhost:5001/',
      deadline: pastDeadline,
    });

    expect(errors.some(e => e.code === 'SCRIPT_TIMEOUT')).toBe(true);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('still executes inline scripts after external script errors', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 } as any);

    const ctx = makeCtx(`
      <script src="/broken.js"></script>
      <script>window.__inline = 'ran';</script>
    `);
    const errors = await loadScripts(ctx, { baseUrl: 'http://localhost:5001/' });

    expect(errors.some(e => e.code === 'SCRIPT_HTTP_ERROR')).toBe(true);
    expect(ctx.window.__inline).toBe('ran');
  });
});

describe('script-loader: inline scripts', () => {
  it('executes inline scripts as before', async () => {
    const ctx = makeCtx('<script>window.__x = 42;</script>');
    const errors = await loadScripts(ctx);

    expect(errors).toHaveLength(0);
    expect(ctx.window.__x).toBe(42);
  });

  it('captures inline script errors without crashing', async () => {
    const ctx = makeCtx('<script>throw new Error("bad script");</script>');
    const errors = await loadScripts(ctx);

    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe('SCRIPT_EXEC_ERROR');
    expect(errors[0].message).toContain('bad script');
  });
});

describe('vm-context: global availability', () => {
  it('exposes globalThis as the sandbox', () => {
    const ctx = createVmContext({ url: 'http://localhost:5001/' });
    const result = ctx.executeScript('globalThis === window');
    expect(result.error).toBeUndefined();
  });

  it('exposes URL constructor', () => {
    const ctx = createVmContext({ url: 'http://localhost:5001/' });
    const result = ctx.executeScript('window.__u = new URL("/path", "http://localhost").toString()');
    expect(result.error).toBeUndefined();
    expect(ctx.window.__u).toBe('http://localhost/path');
  });

  it('exposes MessageChannel for React scheduler', () => {
    const ctx = createVmContext({ url: 'http://localhost:5001/' });
    const result = ctx.executeScript(
      'const ch = new MessageChannel(); window.__hasPort = ch.port1 !== undefined;',
    );
    expect(result.error).toBeUndefined();
    expect(ctx.window.__hasPort).toBe(true);
  });

  it('exposes requestAnimationFrame', () => {
    const ctx = createVmContext({ url: 'http://localhost:5001/' });
    const result = ctx.executeScript(
      'window.__rafType = typeof requestAnimationFrame;',
    );
    expect(result.error).toBeUndefined();
    expect(ctx.window.__rafType).toBe('function');
  });

  it('exposes fetch', () => {
    const ctx = createVmContext({ url: 'http://localhost:5001/' });
    const result = ctx.executeScript('window.__fetchType = typeof fetch;');
    expect(result.error).toBeUndefined();
    expect(ctx.window.__fetchType).toBe('function');
  });
});

describe('event-loop-flush: flushReactRender', () => {
  it('returns immediately when DOM is already stable (non-SPA page)', async () => {
    const ctx = createVmContext({ url: 'http://localhost:5001/' });
    ctx.document.body.innerHTML = '<h1>Server-rendered page</h1>';

    const result = await flushReactRender(ctx.document, { timeoutMs: 500, stableRounds: 3 });

    expect(result.stable).toBe(true);
    expect(result.elementCount).toBeGreaterThan(0);
    // Should not have needed many rounds since DOM was already stable
    expect(result.rounds).toBeLessThan(20);
  });

  it('detects DOM population from a deferred script (simulates React MessageChannel render)', async () => {
    const ctx = createVmContext({ url: 'http://localhost:5001/' });
    ctx.document.body.innerHTML = '<div id="root"></div>';

    // Simulate React's deferred render: after one event loop turn, populate the root
    setImmediate(() => {
      ctx.document.getElementById('root').innerHTML =
        '<main><h1>App loaded</h1><p>Content rendered by React</p></main>';
    });

    const result = await flushReactRender(ctx.document, {
      timeoutMs: 1000,
      stableRounds: 3,
      waitForSelector: '#root > *',
    });

    expect(result.stable).toBe(true);
    expect(ctx.document.querySelector('#root > *')).not.toBeNull();
    expect(ctx.document.querySelector('h1')?.textContent).toBe('App loaded');
  });

  it('detects multi-phase renders (initial render + data fetch re-render)', async () => {
    const ctx = createVmContext({ url: 'http://localhost:5001/' });
    ctx.document.body.innerHTML = '<div id="root"></div>';

    // Phase 1: initial render (loading state)
    setImmediate(() => {
      ctx.document.getElementById('root').innerHTML = '<div class="loading">Loading...</div>';
    });

    // Phase 2: data arrives, re-render
    setTimeout(() => {
      ctx.document.getElementById('root').innerHTML =
        '<div class="content"><h1>PayPal</h1><p>Connect your account</p></div>';
    }, 50);

    const result = await flushReactRender(ctx.document, {
      timeoutMs: 1000,
      stableRounds: 3,
      waitForSelector: '#root .content',
    });

    expect(result.stable).toBe(true);
    expect(ctx.document.querySelector('h1')?.textContent).toBe('PayPal');
  });

  it('times out gracefully when DOM never stabilizes (element count keeps growing)', async () => {
    const ctx = createVmContext({ url: 'http://localhost:5001/' });
    ctx.document.body.innerHTML = '<div id="root"></div>';

    // Thrash at setImmediate speed — same as the polling interval — so element
    // count grows on every round and stability is never reached.
    let active = true;
    function thrash() {
      if (!active) return;
      const el = ctx.document.createElement('span');
      ctx.document.body.appendChild(el);
      setImmediate(thrash);
    }
    setImmediate(thrash);

    const result = await flushReactRender(ctx.document, {
      timeoutMs: 150,
      stableRounds: 5,
    });

    active = false;
    // Should have timed out rather than hanging forever
    expect(result.stable).toBe(false);
  });

  it('exits quickly on non-SPA pages (no #root present)', async () => {
    const ctx = createVmContext({ url: 'http://localhost:5001/' });
    ctx.document.body.innerHTML = '<nav>Nav</nav><main>Content</main>';

    const start = Date.now();
    const result = await flushReactRender(ctx.document, {
      timeoutMs: 500,
      stableRounds: 3,
      // Don't require #root — not a SPA
    });
    const elapsed = Date.now() - start;

    expect(result.stable).toBe(true);
    // Should resolve quickly — no deferred rendering
    expect(elapsed).toBeLessThan(200);
  });
});

describe('vm-context: addEventListener wired to EventTarget', () => {
  it('addEventListener does not throw (React Router requirement)', () => {
    const ctx = createVmContext({ url: 'http://localhost:5001/' });
    const result = ctx.executeScript(`
      window.addEventListener('popstate', function() {});
      window.__listenerAdded = true;
    `);
    expect(result.error).toBeUndefined();
    expect(ctx.window.__listenerAdded).toBe(true);
  });

  it('dispatchEvent fires listeners added via addEventListener', () => {
    const ctx = createVmContext({ url: 'http://localhost:5001/' });
    const result = ctx.executeScript(`
      window.__fired = false;
      window.addEventListener('test-event', function(e) {
        window.__fired = true;
        window.__eventType = e.type;
      });
      window.dispatchEvent(new CustomEvent('test-event'));
    `);
    expect(result.error).toBeUndefined();
    expect(ctx.window.__fired).toBe(true);
    expect(ctx.window.__eventType).toBe('test-event');
  });
});

describe('CLI --text flag: query command', () => {
  it('parses --text flag from argv', async () => {
    const { parseArgs } = await import('../cli/index');
    const args = parseArgs(['query', 'http://localhost:5001/', '--text', 'PayPal']);
    expect(args.text).toBe('PayPal');
    expect(args.command).toBe('query');
  });

  it('text search finds matching elements in rendered DOM', async () => {
    const { execute } = await import('../cli/commands/query');
    // data: URL so no network fetch needed
    const html = encodeURIComponent(
      '<html><body><div class="payment-section"><h2>PayPal</h2><p>Connect your PayPal account</p></div></body></html>',
    );
    const result = await execute({
      command: 'query',
      url: `data:text/html,${html}`,
      text: 'PayPal',
      format: 'json',
      timeout: 2000,
      noJs: true,
      parallel: false,
      verbose: false,
      bail: false,
      noColor: false,
      selectorStrategy: 'css',
      rest: [],
    });

    expect(result.exitCode).toBe(0);
    expect(result.data.status).toBe('found');
    expect(result.data.count).toBeGreaterThan(0);
    expect(result.data.strategy).toBe('text');
  });

  it('text search returns exitCode 1 and not-found status when missing', async () => {
    const { execute } = await import('../cli/commands/query');
    const html = encodeURIComponent('<html><body><p>No payment section here</p></body></html>');
    const result = await execute({
      command: 'query',
      url: `data:text/html,${html}`,
      text: 'PayPal',
      format: 'json',
      timeout: 2000,
      noJs: true,
      parallel: false,
      verbose: false,
      bail: false,
      noColor: false,
      selectorStrategy: 'css',
      rest: [],
    });

    expect(result.exitCode).toBe(1);
    expect(result.data.status).toBe('not-found');
    expect(result.data.count).toBe(0);
  });
});
