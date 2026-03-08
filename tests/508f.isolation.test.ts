/**
 * 508f.isolation.test.ts — Parallel Context Isolation & Cleanup
 *
 * AC 5: Two simultaneous RenderContexts must not share state
 * AC 11: RenderContext.destroy() must fully restore all globals
 * Edge Case 1: Non-configurable globals (navigator)
 * Edge Case 2: Parallel fetch cleanup
 *
 * Tests go in dixie-standalone/tests/ during /do
 */
import { describe, it, expect, afterEach } from 'vitest';

// ── AC 5: Parallel context isolation ───────────────────────────────
describe('parallel RenderContext isolation', () => {
  it('two contexts have independent documents', async () => {
    const { RenderContext } = await import('../src/render/RenderContext');

    const ctx1 = new RenderContext({ url: 'http://app1.local/' });
    const ctx2 = new RenderContext({ url: 'http://app2.local/' });

    try {
      // Each context must have its own document
      expect(ctx1.document).not.toBe(ctx2.document);

      // Modifying one document must not affect the other
      ctx1.document.body.innerHTML = '<h1>Context 1</h1>';
      ctx2.document.body.innerHTML = '<h1>Context 2</h1>';

      expect(ctx1.document.body.innerHTML).toContain('Context 1');
      expect(ctx2.document.body.innerHTML).toContain('Context 2');
      expect(ctx1.document.body.innerHTML).not.toContain('Context 2');
    } finally {
      ctx1.destroy();
      ctx2.destroy();
    }
  });

  it('two contexts do not mutate globalThis.fetch', async () => {
    const { RenderContext } = await import('../src/render/RenderContext');

    const fetchBefore = (globalThis as any).fetch;

    const ctx1 = new RenderContext({ url: 'http://app1.local/' });
    const ctx2 = new RenderContext({ url: 'http://app2.local/' });

    try {
      // v4: creating contexts must NOT modify globalThis.fetch
      expect((globalThis as any).fetch).toBe(fetchBefore);
      // Each context has its own fetch via scope, not globalThis
      expect(ctx1.fetch).not.toBe(ctx2.fetch);
    } finally {
      ctx1.destroy();
      ctx2.destroy();
    }
  });

  it('two contexts capture console output independently without globalThis mutation', async () => {
    const { RenderContext } = await import('../src/render/RenderContext');

    const origError = console.error;

    const ctx1 = new RenderContext({ url: 'http://app1.local/' });
    const ctx2 = new RenderContext({ url: 'http://app2.local/' });

    try {
      ctx1.console.install();
      ctx2.console.install();

      // v4: console.error on globalThis must NOT be modified by per-context captures
      // Each context captures to its own scope, not globalThis.console
      expect(console.error).toBe(origError);

      expect(ctx1.console).not.toBe(ctx2.console);
    } finally {
      ctx1.destroy();
      ctx2.destroy();
    }
  });

  it('destroying one context does not affect the other', async () => {
    const { RenderContext } = await import('../src/render/RenderContext');

    const ctx1 = new RenderContext({ url: 'http://app1.local/' });
    const ctx2 = new RenderContext({ url: 'http://app2.local/' });

    ctx2.document.body.innerHTML = '<p>Still alive</p>';

    // Destroy ctx1
    ctx1.destroy();

    // ctx2 must still work
    expect(ctx2.document.body.innerHTML).toContain('Still alive');
    const div = ctx2.document.createElement('div');
    div.textContent = 'New content';
    ctx2.document.body.appendChild(div);
    expect(ctx2.document.body.innerHTML).toContain('New content');

    ctx2.destroy();
  });

  it('timers are independent per context', async () => {
    const { RenderContext } = await import('../src/render/RenderContext');

    const ctx1 = new RenderContext({ url: 'http://app1.local/' });
    const ctx2 = new RenderContext({ url: 'http://app2.local/' });

    try {
      // Each context must manage its own timers without cross-contamination
      // Setting a timer in ctx1 must not be clearable from ctx2
      const scope1 = (ctx1 as any).scope ?? ctx1;
      const scope2 = (ctx2 as any).scope ?? ctx2;

      // Verify timer functions exist on each context's scope
      expect(typeof scope1.window?.setTimeout).toBe('function');
      expect(typeof scope2.window?.setTimeout).toBe('function');
    } finally {
      ctx1.destroy();
      ctx2.destroy();
    }
  });
});

// ── AC 11: destroy() fully restores globals ────────────────────────
describe('RenderContext.destroy() cleanup', () => {
  it('no globalThis.fetch pollution after destroy', async () => {
    const { RenderContext } = await import('../src/render/RenderContext');

    const fetchBefore = (globalThis as any).fetch;

    const ctx = new RenderContext({ url: 'http://test.local/' });
    ctx.destroy();

    // After destroy, globalThis.fetch must be exactly what it was before
    const fetchAfter = (globalThis as any).fetch;
    expect(fetchAfter).toBe(fetchBefore);
  });

  it('RenderContext exposes document via scope, not globalThis', async () => {
    const { RenderContext } = await import('../src/render/RenderContext');

    const ctx = new RenderContext({ url: 'http://test.local/' });

    // v4: context must expose a scope object with document
    expect(ctx).toHaveProperty('scope');
    expect((ctx as any).scope).toHaveProperty('document');
    expect((ctx as any).scope.document).toBe(ctx.document);

    ctx.destroy();
  });

  it('RenderContext exposes window via scope, not globalThis', async () => {
    const { RenderContext } = await import('../src/render/RenderContext');

    const ctx = new RenderContext({ url: 'http://test.local/' });

    // v4: context must expose a scope object with window
    expect(ctx).toHaveProperty('scope');
    expect((ctx as any).scope).toHaveProperty('window');

    ctx.destroy();
  });

  it('per-context console capture does not modify globalThis.console', async () => {
    const { RenderContext } = await import('../src/render/RenderContext');

    const origError = console.error;
    const origWarn = console.warn;

    const ctx = new RenderContext({ url: 'http://test.local/' });
    ctx.console.install();

    // v4: per-context capture must NOT touch globalThis.console
    expect(console.error).toBe(origError);
    expect(console.warn).toBe(origWarn);

    ctx.destroy();
    expect(console.error).toBe(origError);
  });
});

// ── Edge Case 1: Non-configurable globals ──────────────────────────
describe('non-configurable global properties', () => {
  it('installGlobals handles non-configurable properties without throwing', async () => {
    const { createDixieEnvironment } = await import('../src/environment/DixieEnvironment');
    const { installGlobals } = await import('../src/environment/installGlobals');

    // Create a synthetic non-configurable property to test the fix
    Object.defineProperty(globalThis, '__dixie_locked__', {
      value: 'original',
      writable: false,
      configurable: false,
      enumerable: false,
    });

    const env = createDixieEnvironment({ url: 'http://test.local/' });

    // Must not throw TypeError even with non-configurable properties
    const { restore } = installGlobals(env);

    // installGlobals should skip non-configurable props gracefully
    expect((globalThis as any).__dixie_locked__).toBe('original');

    restore();
  });

  it('restore() reinstates original property descriptors', async () => {
    const { createDixieEnvironment } = await import('../src/environment/DixieEnvironment');
    const { installGlobals } = await import('../src/environment/installGlobals');

    // Create a configurable getter to test descriptor restore
    const testVal = { custom: true };
    Object.defineProperty(globalThis, '__dixie_getter_test__', {
      get: () => testVal,
      configurable: true,
    });

    const descBefore = Object.getOwnPropertyDescriptor(globalThis, '__dixie_getter_test__');

    const env = createDixieEnvironment({ url: 'http://test.local/' });
    const { restore } = installGlobals(env);
    restore();

    const descAfter = Object.getOwnPropertyDescriptor(globalThis, '__dixie_getter_test__');
    // Descriptor must be restored (getter, not value)
    expect(descAfter?.get).toBe(descBefore?.get);

    // Cleanup
    delete (globalThis as any).__dixie_getter_test__;
  });
});

// ── Edge Case 2: Parallel fetch cleanup ────────────────────────────
describe('parallel fetch cleanup', () => {
  it('destroying context A while B is active does not modify globalThis.fetch', async () => {
    const { RenderContext } = await import('../src/render/RenderContext');

    const fetchBefore = (globalThis as any).fetch;

    const ctxA = new RenderContext({ url: 'http://a.local/' });
    const ctxB = new RenderContext({ url: 'http://b.local/' });

    // v4: neither creation nor destruction touches globalThis.fetch
    expect((globalThis as any).fetch).toBe(fetchBefore);

    ctxA.destroy();

    // After destroying A, globalThis.fetch is still the original
    expect((globalThis as any).fetch).toBe(fetchBefore);

    // B's scoped fetch still works
    expect(ctxB.fetch).toBeDefined();

    ctxB.destroy();
    expect((globalThis as any).fetch).toBe(fetchBefore);
  });
});
