/**
 * Tests for LiveFetch — real network wrapper with UA/Origin injection,
 * request recording, and promise-level script caching.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LiveFetch } from '../src/fetch/LiveFetch';

describe('LiveFetch', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  // ── Header injection ──────────────────────────────────────────────

  describe('header injection', () => {
    it('injects User-Agent, Origin, and Referer on every request', async () => {
      let capturedHeaders: Headers | undefined;
      globalThis.fetch = vi.fn(async (_input: any, init?: any) => {
        capturedHeaders = new Headers(init?.headers);
        return new Response('ok');
      }) as any;

      const lf = new LiveFetch({
        pageUrl: 'https://example.com/page',
        userAgent: 'TestAgent/1.0',
      });

      await lf.fetch('https://api.example.com/data');

      expect(capturedHeaders!.get('User-Agent')).toBe('TestAgent/1.0');
      expect(capturedHeaders!.get('Origin')).toBe('https://example.com');
      expect(capturedHeaders!.get('Referer')).toBe('https://example.com/page');
    });

    it('does not overwrite caller-provided headers', async () => {
      let capturedHeaders: Headers | undefined;
      globalThis.fetch = vi.fn(async (_input: any, init?: any) => {
        capturedHeaders = new Headers(init?.headers);
        return new Response('ok');
      }) as any;

      const lf = new LiveFetch({
        pageUrl: 'https://example.com',
        userAgent: 'Default/1.0',
      });

      await lf.fetch('https://api.example.com', {
        headers: { 'User-Agent': 'Custom/2.0' },
      });

      expect(capturedHeaders!.get('User-Agent')).toBe('Custom/2.0');
    });
  });

  // ── Request recording ─────────────────────────────────────────────

  describe('request recording', () => {
    it('records all requests', async () => {
      globalThis.fetch = vi.fn(async () => new Response('ok')) as any;

      const lf = new LiveFetch({
        pageUrl: 'https://example.com',
        userAgent: 'Test/1.0',
      });

      await lf.fetch('https://api.example.com/a');
      await lf.fetch('https://api.example.com/b', { method: 'POST' });

      const requests = lf.getRequests();
      expect(requests).toHaveLength(2);
      expect(requests[0].url).toBe('https://api.example.com/a');
      expect(requests[0].method).toBe('GET');
      expect(requests[1].url).toBe('https://api.example.com/b');
      expect(requests[1].method).toBe('POST');
    });

    it('getRequestsTo filters by URL prefix', async () => {
      globalThis.fetch = vi.fn(async () => new Response('ok')) as any;

      const lf = new LiveFetch({
        pageUrl: 'https://example.com',
        userAgent: 'Test/1.0',
      });

      await lf.fetch('https://api.example.com/users');
      await lf.fetch('https://cdn.example.com/script.js');

      expect(lf.getRequestsTo('https://api.example.com')).toHaveLength(1);
      expect(lf.getRequestsTo('https://cdn.example.com')).toHaveLength(1);
    });

    it('clearRequests empties recorded requests', async () => {
      globalThis.fetch = vi.fn(async () => new Response('ok')) as any;

      const lf = new LiveFetch({
        pageUrl: 'https://example.com',
        userAgent: 'Test/1.0',
      });

      await lf.fetch('https://api.example.com/a');
      lf.clearRequests();
      expect(lf.getRequests()).toHaveLength(0);
    });
  });

  // ── fetchText caching ─────────────────────────────────────────────

  describe('fetchText caching', () => {
    it('caches script content by URL', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn(async () => {
        callCount++;
        return new Response('console.log("hello")');
      }) as any;

      const lf = new LiveFetch({
        pageUrl: 'https://example.com',
        userAgent: 'Test/1.0',
      });

      const text1 = await lf.fetchText('https://cdn.example.com/app.js');
      const text2 = await lf.fetchText('https://cdn.example.com/app.js');

      expect(text1).toBe('console.log("hello")');
      expect(text2).toBe('console.log("hello")');
      expect(callCount).toBe(1); // Only one actual network request
    });

    it('concurrent fetches for same URL coalesce', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn(async () => {
        callCount++;
        return new Response('var x = 1;');
      }) as any;

      const lf = new LiveFetch({
        pageUrl: 'https://example.com',
        userAgent: 'Test/1.0',
      });

      const [a, b, c] = await Promise.all([
        lf.fetchText('https://cdn.example.com/lib.js'),
        lf.fetchText('https://cdn.example.com/lib.js'),
        lf.fetchText('https://cdn.example.com/lib.js'),
      ]);

      expect(a).toBe('var x = 1;');
      expect(b).toBe('var x = 1;');
      expect(c).toBe('var x = 1;');
      expect(callCount).toBe(1);
    });

    it('clearCache allows re-fetching', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn(async () => {
        callCount++;
        return new Response(`version ${callCount}`);
      }) as any;

      const lf = new LiveFetch({
        pageUrl: 'https://example.com',
        userAgent: 'Test/1.0',
      });

      const v1 = await lf.fetchText('https://cdn.example.com/app.js');
      lf.clearCache();
      const v2 = await lf.fetchText('https://cdn.example.com/app.js');

      expect(v1).toBe('version 1');
      expect(v2).toBe('version 2');
    });
  });

  // ── Reset ─────────────────────────────────────────────────────────

  describe('reset', () => {
    it('clears both requests and cache', async () => {
      globalThis.fetch = vi.fn(async () => new Response('ok')) as any;

      const lf = new LiveFetch({
        pageUrl: 'https://example.com',
        userAgent: 'Test/1.0',
      });

      await lf.fetch('https://api.example.com/a');
      await lf.fetchText('https://cdn.example.com/app.js');

      lf.reset();
      expect(lf.getRequests()).toHaveLength(0);
      // After reset, fetchText should re-fetch
      await lf.fetchText('https://cdn.example.com/app.js');
      // 3 total: original fetch, original fetchText, re-fetchText
      expect(lf.getRequests()).toHaveLength(1);
    });
  });
});
