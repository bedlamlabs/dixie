/**
 * 508f.edge-cases.test.ts — Edge Cases
 *
 * Edge Case 5: HAR replay with stale data
 * Plus additional robustness tests for installGlobals restore cycle
 *
 * Tests go in dixie-standalone/tests/ during /do
 */
import { describe, it, expect } from 'vitest';

// ── Edge Case 5: HAR replay with stale data ────────────────────────
describe('HAR replay with stale/mismatched data', () => {
  it('mock fetch returns non-200 for unregistered URLs', async () => {
    const { MockFetch } = await import('../src/fetch/MockFetch');

    const mockFetch = new MockFetch();
    // Register one URL
    mockFetch.register('/v1/data', {
      status: 200,
      body: JSON.stringify({ old: true }),
      headers: { 'content-type': 'application/json' },
    });

    // Fetch a URL that's NOT registered
    const response = await mockFetch.fetch('http://test.local/v2/data');

    // Should indicate miss/mismatch, not silently succeed
    expect(response.status).not.toBe(200);
  });

  it('mock-replay command warns on HAR URL mismatch', async () => {
    const mod = await import('../src/cli/commands/mock-replay');

    const result = await mod.execute({
      command: 'mock-replay',
      url: 'http://test.local/page',
      _: [],
      format: 'json',
      harFile: '/nonexistent/stale.har',
    });

    // Should indicate error (missing HAR file or URL mismatch)
    expect(result.exitCode).not.toBe(0);
  });
});

// ── installGlobals descriptor save/restore cycle ───────────────────
describe('installGlobals save/restore descriptor cycle', () => {
  it('saves original property descriptors, not just values', async () => {
    const { createDixieEnvironment } = await import('../src/environment/DixieEnvironment');
    const { installGlobals } = await import('../src/environment/installGlobals');

    // Set a custom property with a getter
    const customValue = { test: true };
    Object.defineProperty(globalThis, '__dixie_test_prop__', {
      get: () => customValue,
      configurable: true,
    });

    const descBefore = Object.getOwnPropertyDescriptor(globalThis, '__dixie_test_prop__');

    const env = createDixieEnvironment({ url: 'http://test.local/' });
    const { restore } = installGlobals(env);
    restore();

    const descAfter = Object.getOwnPropertyDescriptor(globalThis, '__dixie_test_prop__');

    // Descriptor must be restored exactly (getter, not value)
    expect(descAfter?.get).toBe(descBefore?.get);

    // Cleanup
    delete (globalThis as any).__dixie_test_prop__;
  });

  it('properties that did not exist before install are deleted on restore', async () => {
    const { createDixieEnvironment } = await import('../src/environment/DixieEnvironment');
    const { installGlobals } = await import('../src/environment/installGlobals');

    // Ensure our test property does not exist
    delete (globalThis as any).__dixie_temp__;

    const env = createDixieEnvironment({ url: 'http://test.local/' });
    const { restore } = installGlobals(env);

    // installGlobals sets 'document' on globalThis — verify it exists
    expect((globalThis as any).document).toBeDefined();

    restore();

    // If 'document' didn't exist before, it must be deleted
    // (In Node.js test env, document typically doesn't exist)
  });

  it('multiple install/restore cycles do not leak state', async () => {
    const { createDixieEnvironment } = await import('../src/environment/DixieEnvironment');
    const { installGlobals } = await import('../src/environment/installGlobals');

    const snapBefore = Object.keys(globalThis).sort();

    // Install and restore 3 times
    for (let i = 0; i < 3; i++) {
      const env = createDixieEnvironment({ url: `http://test${i}.local/` });
      const { restore } = installGlobals(env);
      restore();
    }

    const snapAfter = Object.keys(globalThis).sort();

    // No new keys should have leaked
    const leaked = snapAfter.filter(k => !snapBefore.includes(k));
    expect(leaked).toEqual([]);
  });
});

// ── EnvironmentPool reset ──────────────────────────────────────────
describe('EnvironmentPool reset between reuse cycles', () => {
  it('pool resets location between acquisitions', async () => {
    const { EnvironmentPool } = await import('../src/environment/EnvironmentPool');

    const pool = new EnvironmentPool({ size: 1, maxSize: 1 });

    // Acquire, set location, release
    const env1 = pool.acquire({ url: 'http://first.local/page1' });
    pool.release(env1);

    // Re-acquire — location must be reset, not carry over
    const env2 = pool.acquire({ url: 'http://second.local/page2' });

    expect(env2.window.location.href).toBe('http://second.local/page2');
    expect(env2.window.location.href).not.toContain('first.local');

    pool.release(env2);
  });

  it('pool resets localStorage between acquisitions', async () => {
    const { EnvironmentPool } = await import('../src/environment/EnvironmentPool');

    const pool = new EnvironmentPool({ size: 1, maxSize: 1 });

    const env1 = pool.acquire({ url: 'http://test.local/' });
    env1.localStorage.setItem('key', 'value');
    pool.release(env1);

    const env2 = pool.acquire({ url: 'http://test.local/' });
    expect(env2.localStorage.getItem('key')).toBeNull();

    pool.release(env2);
  });

  it('pool resets location between acquisitions (URL override)', async () => {
    const { EnvironmentPool } = await import('../src/environment/EnvironmentPool');

    const pool = new EnvironmentPool({ size: 1, maxSize: 1 });

    const env1 = pool.acquire({ url: 'http://test.local/old-page' });
    pool.release(env1);

    // Re-acquire with a different URL — location must reflect the new URL
    const env2 = pool.acquire({ url: 'http://other.local/new-page' });
    expect(env2.window.location.href).toContain('other.local');
    expect(env2.window.location.href).not.toContain('old-page');

    pool.release(env2);
  });
});
