import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DixieHeaders } from '../src/fetch/Headers';
import { DixieRequest } from '../src/fetch/Request';
import { DixieResponse } from '../src/fetch/Response';
import { MockFetch } from '../src/fetch/MockFetch';

// ═══════════════════════════════════════════════════════════════════════
// DixieHeaders
// ═══════════════════════════════════════════════════════════════════════

describe('DixieHeaders', () => {
  // ─── Construction ──────────────────────────────────────────────────

  describe('construction', () => {
    it('creates empty headers with no argument', () => {
      const h = new DixieHeaders();
      expect(h.has('anything')).toBe(false);
    });

    it('creates headers from a Record', () => {
      const h = new DixieHeaders({ 'Content-Type': 'text/plain', 'X-Custom': 'yes' });
      expect(h.get('content-type')).toBe('text/plain');
      expect(h.get('x-custom')).toBe('yes');
    });

    it('creates headers from a tuple array', () => {
      const h = new DixieHeaders([['Accept', 'application/json'], ['Accept', 'text/html']]);
      // Tuple arrays use append, so values should be comma-joined
      expect(h.get('accept')).toBe('application/json, text/html');
    });

    it('creates headers from another DixieHeaders instance', () => {
      const original = new DixieHeaders({ Authorization: 'Bearer xyz' });
      const copy = new DixieHeaders(original);
      expect(copy.get('authorization')).toBe('Bearer xyz');
    });
  });

  // ─── Case insensitivity ────────────────────────────────────────────

  describe('case insensitivity', () => {
    it('get() is case-insensitive', () => {
      const h = new DixieHeaders();
      h.set('Content-Type', 'text/html');
      expect(h.get('content-type')).toBe('text/html');
      expect(h.get('CONTENT-TYPE')).toBe('text/html');
      expect(h.get('Content-Type')).toBe('text/html');
    });

    it('has() is case-insensitive', () => {
      const h = new DixieHeaders();
      h.set('X-Foo', 'bar');
      expect(h.has('x-foo')).toBe(true);
      expect(h.has('X-FOO')).toBe(true);
    });

    it('delete() is case-insensitive', () => {
      const h = new DixieHeaders();
      h.set('X-Foo', 'bar');
      h.delete('X-FOO');
      expect(h.has('x-foo')).toBe(false);
    });
  });

  // ─── get / set / has / delete ──────────────────────────────────────

  describe('get / set / has / delete', () => {
    it('get returns null for missing header', () => {
      const h = new DixieHeaders();
      expect(h.get('missing')).toBeNull();
    });

    it('set overwrites existing value', () => {
      const h = new DixieHeaders();
      h.set('X-Val', 'first');
      h.set('X-Val', 'second');
      expect(h.get('x-val')).toBe('second');
    });

    it('delete removes a header', () => {
      const h = new DixieHeaders();
      h.set('X-Gone', 'bye');
      h.delete('X-Gone');
      expect(h.get('x-gone')).toBeNull();
    });
  });

  // ─── append ────────────────────────────────────────────────────────

  describe('append', () => {
    it('appends to existing header with comma separator', () => {
      const h = new DixieHeaders();
      h.set('Accept', 'text/html');
      h.append('Accept', 'application/json');
      expect(h.get('accept')).toBe('text/html, application/json');
    });

    it('creates header if it does not exist', () => {
      const h = new DixieHeaders();
      h.append('X-New', 'value');
      expect(h.get('x-new')).toBe('value');
    });

    it('appends multiple times', () => {
      const h = new DixieHeaders();
      h.append('Accept', 'text/html');
      h.append('Accept', 'application/json');
      h.append('Accept', 'text/xml');
      expect(h.get('accept')).toBe('text/html, application/json, text/xml');
    });
  });

  // ─── Iteration ────────────────────────────────────────────────────

  describe('iteration', () => {
    it('forEach iterates over all headers', () => {
      const h = new DixieHeaders({ a: '1', b: '2' });
      const pairs: [string, string][] = [];
      h.forEach((value, key) => {
        pairs.push([key, value]);
      });
      expect(pairs).toEqual([['a', '1'], ['b', '2']]);
    });

    it('entries() yields [key, value] pairs', () => {
      const h = new DixieHeaders({ x: '10' });
      const entries = [...h.entries()];
      expect(entries).toEqual([['x', '10']]);
    });

    it('keys() yields header names', () => {
      const h = new DixieHeaders({ alpha: 'a', beta: 'b' });
      const keys = [...h.keys()];
      expect(keys).toEqual(['alpha', 'beta']);
    });

    it('values() yields header values', () => {
      const h = new DixieHeaders({ alpha: 'a', beta: 'b' });
      const values = [...h.values()];
      expect(values).toEqual(['a', 'b']);
    });

    it('is iterable with for...of via Symbol.iterator', () => {
      const h = new DixieHeaders({ one: '1' });
      const result: [string, string][] = [];
      for (const pair of h) {
        result.push(pair);
      }
      expect(result).toEqual([['one', '1']]);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// DixieRequest
// ═══════════════════════════════════════════════════════════════════════

describe('DixieRequest', () => {
  it('creates a GET request from a URL string', () => {
    const req = new DixieRequest('https://example.com/api');
    expect(req.url).toBe('https://example.com/api');
    expect(req.method).toBe('GET');
    expect(req.body).toBeNull();
  });

  it('creates a POST request with body', () => {
    const req = new DixieRequest('/api/data', {
      method: 'POST',
      body: JSON.stringify({ name: 'test' }),
      headers: { 'Content-Type': 'application/json' },
    });
    expect(req.method).toBe('POST');
    expect(req.body).toBe('{"name":"test"}');
    expect(req.headers.get('content-type')).toBe('application/json');
  });

  it('uppercases the method', () => {
    const req = new DixieRequest('/api', { method: 'patch' });
    expect(req.method).toBe('PATCH');
  });

  it('defaults signal to null', () => {
    const req = new DixieRequest('/api');
    expect(req.signal).toBeNull();
  });

  it('json() parses body as JSON', async () => {
    const req = new DixieRequest('/api', {
      method: 'POST',
      body: JSON.stringify({ key: 'value' }),
    });
    const data = await req.json();
    expect(data).toEqual({ key: 'value' });
  });

  it('text() returns body as string', async () => {
    const req = new DixieRequest('/api', { method: 'POST', body: 'hello' });
    const text = await req.text();
    expect(text).toBe('hello');
  });

  it('text() returns empty string when body is null', async () => {
    const req = new DixieRequest('/api');
    const text = await req.text();
    expect(text).toBe('');
  });

  it('json() throws when body is null', async () => {
    const req = new DixieRequest('/api');
    await expect(req.json()).rejects.toThrow('Body is null');
  });

  it('clone() creates an independent copy', () => {
    const req = new DixieRequest('/api/test', {
      method: 'PUT',
      headers: { 'X-Custom': 'yes' },
      body: '{"a":1}',
    });
    const cloned = req.clone();
    expect(cloned.url).toBe('/api/test');
    expect(cloned.method).toBe('PUT');
    expect(cloned.headers.get('x-custom')).toBe('yes');
    expect(cloned.body).toBe('{"a":1}');
    // Verify independence
    expect(cloned).not.toBe(req);
  });

  it('clone() throws after body has been consumed', async () => {
    const req = new DixieRequest('/api', { method: 'POST', body: 'data' });
    await req.text();
    expect(() => req.clone()).toThrow('body has already been consumed');
  });

  it('constructs from another DixieRequest', () => {
    const original = new DixieRequest('/api/original', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer token' },
    });
    const copy = new DixieRequest(original);
    expect(copy.url).toBe('/api/original');
    expect(copy.method).toBe('DELETE');
    expect(copy.headers.get('authorization')).toBe('Bearer token');
  });

  it('constructs from another DixieRequest with overrides', () => {
    const original = new DixieRequest('/api/original', {
      method: 'GET',
      headers: { 'X-Old': 'val' },
    });
    const overridden = new DixieRequest(original, {
      method: 'POST',
      body: '{"new":true}',
    });
    expect(overridden.url).toBe('/api/original');
    expect(overridden.method).toBe('POST');
    expect(overridden.body).toBe('{"new":true}');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// DixieResponse
// ═══════════════════════════════════════════════════════════════════════

describe('DixieResponse', () => {
  // ─── Basic properties ──────────────────────────────────────────────

  describe('basic properties', () => {
    it('defaults to status 200 and statusText OK', () => {
      const res = new DixieResponse('body');
      expect(res.status).toBe(200);
      expect(res.statusText).toBe('OK');
      expect(res.ok).toBe(true);
    });

    it('reports ok=false for 400+ status', () => {
      const res = new DixieResponse(null, { status: 404, statusText: 'Not Found' });
      expect(res.ok).toBe(false);
      expect(res.status).toBe(404);
    });

    it('reports ok=true for 299', () => {
      const res = new DixieResponse(null, { status: 299 });
      expect(res.ok).toBe(true);
    });

    it('reports ok=false for 300', () => {
      const res = new DixieResponse(null, { status: 300 });
      expect(res.ok).toBe(false);
    });

    it('has type "basic" and redirected false', () => {
      const res = new DixieResponse('test');
      expect(res.type).toBe('basic');
      expect(res.redirected).toBe(false);
    });

    it('stores url from init', () => {
      const res = new DixieResponse('body', { url: '/api/test' });
      expect(res.url).toBe('/api/test');
    });

    it('url defaults to empty string', () => {
      const res = new DixieResponse('body');
      expect(res.url).toBe('');
    });
  });

  // ─── Body consumption ─────────────────────────────────────────────

  describe('body consumption', () => {
    it('json() parses JSON body', async () => {
      const res = new DixieResponse(JSON.stringify({ count: 5 }));
      const data = await res.json();
      expect(data).toEqual({ count: 5 });
      expect(res.bodyUsed).toBe(true);
    });

    it('text() returns raw body', async () => {
      const res = new DixieResponse('hello world');
      const text = await res.text();
      expect(text).toBe('hello world');
      expect(res.bodyUsed).toBe(true);
    });

    it('text() returns empty string for null body', async () => {
      const res = new DixieResponse(null);
      const text = await res.text();
      expect(text).toBe('');
    });

    it('json() throws after body consumed', async () => {
      const res = new DixieResponse('{"a":1}');
      await res.json();
      await expect(res.json()).rejects.toThrow('already been consumed');
    });

    it('text() throws after body consumed', async () => {
      const res = new DixieResponse('data');
      await res.text();
      await expect(res.text()).rejects.toThrow('already been consumed');
    });

    it('blob() returns a Blob-like object', async () => {
      const res = new DixieResponse('binary data', {
        headers: { 'Content-Type': 'application/octet-stream' },
      });
      const blob = await res.blob();
      expect(blob.size).toBe(11);
      expect(blob.type).toBe('application/octet-stream');
      const text = await blob.text();
      expect(text).toBe('binary data');
    });

    it('arrayBuffer() returns an ArrayBuffer', async () => {
      const res = new DixieResponse('AB');
      const buf = await res.arrayBuffer();
      expect(buf).toBeInstanceOf(ArrayBuffer);
      expect(buf.byteLength).toBe(2);
    });
  });

  // ─── clone() ───────────────────────────────────────────────────────

  describe('clone()', () => {
    it('creates an independent response with same data', async () => {
      const res = new DixieResponse('{"x":1}', { status: 201, statusText: 'Created' });
      const cloned = res.clone();
      expect(cloned.status).toBe(201);
      expect(cloned.statusText).toBe('Created');
      // Both can be read independently
      const data1 = await res.json();
      const data2 = await cloned.json();
      expect(data1).toEqual({ x: 1 });
      expect(data2).toEqual({ x: 1 });
    });

    it('clone() throws after body consumed', async () => {
      const res = new DixieResponse('data');
      await res.text();
      expect(() => res.clone()).toThrow('already been consumed');
    });
  });

  // ─── Static methods ────────────────────────────────────────────────

  describe('static methods', () => {
    it('Response.json() creates a JSON response', async () => {
      const res = DixieResponse.json({ ok: true });
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toBe('application/json');
      const data = await res.json();
      expect(data).toEqual({ ok: true });
    });

    it('Response.json() with custom status', async () => {
      const res = DixieResponse.json({ error: 'bad' }, { status: 400 });
      expect(res.status).toBe(400);
      expect(res.ok).toBe(false);
    });

    it('Response.error() returns a type=error response', () => {
      const res = DixieResponse.error();
      expect(res.type).toBe('error');
      expect(res.status).toBe(0);
    });

    it('Response.redirect() creates a redirect response', () => {
      const res = DixieResponse.redirect('https://example.com', 301);
      expect(res.status).toBe(301);
      expect(res.headers.get('location')).toBe('https://example.com');
    });

    it('Response.redirect() defaults to 302', () => {
      const res = DixieResponse.redirect('/login');
      expect(res.status).toBe(302);
    });

    it('Response.redirect() throws for invalid status', () => {
      expect(() => DixieResponse.redirect('/bad', 200)).toThrow('Invalid redirect status');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// MockFetch
// ═══════════════════════════════════════════════════════════════════════

describe('MockFetch', () => {
  let mockFetch: MockFetch;

  beforeEach(() => {
    mockFetch = new MockFetch();
  });

  // ─── Register / Unregister / ClearRegistry ─────────────────────────

  describe('register / unregister / clearRegistry', () => {
    it('registers a URL and returns its response', async () => {
      mockFetch.register('/api/users', { body: { users: ['Alice'] } });
      const res = await mockFetch.fetch('/api/users');
      const data = await res.json();
      expect(data).toEqual({ users: ['Alice'] });
    });

    it('unregisters a URL so it falls through to 404', async () => {
      mockFetch.register('/api/data', { body: { ok: true } });
      mockFetch.unregister('/api/data');
      const res = await mockFetch.fetch('/api/data');
      expect(res.status).toBe(404);
    });

    it('clearRegistry removes all registered URLs', async () => {
      mockFetch.register('/api/a', { body: 'a' });
      mockFetch.register('/api/b', { body: 'b' });
      mockFetch.clearRegistry();
      const resA = await mockFetch.fetch('/api/a');
      const resB = await mockFetch.fetch('/api/b');
      expect(resA.status).toBe(404);
      expect(resB.status).toBe(404);
    });
  });

  // ─── Longest prefix matching (critical) ────────────────────────────

  describe('longest prefix matching', () => {
    it('matches the longest prefix when multiple patterns apply', async () => {
      mockFetch.register('/api/subscription', { body: { tier: 'free' } });
      mockFetch.register('/api/subscription/bundle', { body: { tier: 'pro', limits: {} } });

      const res = await mockFetch.fetch('/api/subscription/bundle/details');
      const data = await res.json();
      expect(data).toEqual({ tier: 'pro', limits: {} });
    });

    it('falls back to shorter prefix when no longer match exists', async () => {
      mockFetch.register('/api/subscription', { body: { tier: 'free' } });
      mockFetch.register('/api/subscription/bundle', { body: { tier: 'pro', limits: {} } });

      const res = await mockFetch.fetch('/api/subscription/usage');
      const data = await res.json();
      expect(data).toEqual({ tier: 'free' });
    });

    it('exact match beats shorter prefix', async () => {
      mockFetch.register('/api', { body: { root: true } });
      mockFetch.register('/api/projects', { body: { projects: [] } });

      const res = await mockFetch.fetch('/api/projects');
      const data = await res.json();
      expect(data).toEqual({ projects: [] });
    });

    it('returns 404 when no prefix matches at all', async () => {
      mockFetch.register('/api/clients', { body: [] });
      const res = await mockFetch.fetch('/other/path');
      expect(res.status).toBe(404);
    });
  });

  // ─── Function handler ──────────────────────────────────────────────

  describe('function handler', () => {
    it('receives the request and returns dynamic config', async () => {
      mockFetch.register('/api/clients', (req) => {
        if (req.method === 'POST') return { status: 201, body: { id: 'new-1' } };
        return { body: { clients: [] } };
      });

      const getRes = await mockFetch.fetch('/api/clients');
      const getData = await getRes.json();
      expect(getData).toEqual({ clients: [] });

      const postRes = await mockFetch.fetch('/api/clients', {
        method: 'POST',
        body: JSON.stringify({ name: 'Jane' }),
      });
      expect(postRes.status).toBe(201);
      const postData = await postRes.json();
      expect(postData).toEqual({ id: 'new-1' });
    });

    it('handler receives correct body', async () => {
      mockFetch.register('/api/echo', (req) => {
        return { body: { received: req.body } };
      });

      const res = await mockFetch.fetch('/api/echo', {
        method: 'PUT',
        body: '{"payload":"data"}',
      });
      const data = await res.json();
      expect(data.received).toBe('{"payload":"data"}');
    });

    it('handler receives correct headers', async () => {
      mockFetch.register('/api/auth', (req) => {
        const token = req.headers.get('authorization');
        if (token === 'Bearer valid') return { body: { authorized: true } };
        return { status: 401, body: { authorized: false } };
      });

      const res = await mockFetch.fetch('/api/auth', {
        headers: { Authorization: 'Bearer valid' },
      });
      const data = await res.json();
      expect(data.authorized).toBe(true);
    });
  });

  // ─── Response status and headers ───────────────────────────────────

  describe('response status and headers', () => {
    it('returns custom status and statusText', async () => {
      mockFetch.register('/api/created', { status: 201, statusText: 'Created', body: {} });
      const res = await mockFetch.fetch('/api/created');
      expect(res.status).toBe(201);
      expect(res.statusText).toBe('Created');
      expect(res.ok).toBe(true);
    });

    it('returns custom response headers', async () => {
      mockFetch.register('/api/custom', {
        body: 'data',
        headers: { 'X-Custom': 'hello', 'Cache-Control': 'no-cache' },
      });
      const res = await mockFetch.fetch('/api/custom');
      expect(res.headers.get('x-custom')).toBe('hello');
      expect(res.headers.get('cache-control')).toBe('no-cache');
    });

    it('sets content-type to application/json for JSON bodies', async () => {
      mockFetch.register('/api/json', { body: { ok: true } });
      const res = await mockFetch.fetch('/api/json');
      expect(res.headers.get('content-type')).toBe('application/json');
    });

    it('does not override explicit content-type header', async () => {
      mockFetch.register('/api/text', {
        body: { msg: 'hi' },
        headers: { 'content-type': 'text/plain' },
      });
      const res = await mockFetch.fetch('/api/text');
      expect(res.headers.get('content-type')).toBe('text/plain');
    });

    it('defaults to status 200 OK', async () => {
      mockFetch.register('/api/default', { body: {} });
      const res = await mockFetch.fetch('/api/default');
      expect(res.status).toBe(200);
      expect(res.statusText).toBe('OK');
    });
  });

  // ─── Request recording ────────────────────────────────────────────

  describe('request recording', () => {
    it('records every fetch call', async () => {
      mockFetch.register('/api/a', { body: 'a' });
      mockFetch.register('/api/b', { body: 'b' });
      await mockFetch.fetch('/api/a');
      await mockFetch.fetch('/api/b', { method: 'POST', body: '{}' });
      const requests = mockFetch.getRequests();
      expect(requests).toHaveLength(2);
      expect(requests[0].url).toBe('/api/a');
      expect(requests[0].method).toBe('GET');
      expect(requests[1].url).toBe('/api/b');
      expect(requests[1].method).toBe('POST');
      expect(requests[1].body).toBe('{}');
    });

    it('records timestamp', async () => {
      const before = Date.now();
      mockFetch.register('/api/t', { body: {} });
      await mockFetch.fetch('/api/t');
      const after = Date.now();
      const req = mockFetch.getRequests()[0];
      expect(req.timestamp).toBeGreaterThanOrEqual(before);
      expect(req.timestamp).toBeLessThanOrEqual(after);
    });

    it('records headers as plain object', async () => {
      mockFetch.register('/api/h', { body: {} });
      await mockFetch.fetch('/api/h', { headers: { 'X-Token': 'abc' } });
      const req = mockFetch.getRequests()[0];
      expect(req.headers['x-token']).toBe('abc');
    });

    it('getRequestsTo filters by URL prefix', async () => {
      mockFetch.register('/api/clients', { body: [] });
      mockFetch.register('/api/projects', { body: [] });
      await mockFetch.fetch('/api/clients');
      await mockFetch.fetch('/api/projects');
      await mockFetch.fetch('/api/clients/123');
      const clientReqs = mockFetch.getRequestsTo('/api/clients');
      expect(clientReqs).toHaveLength(2);
      expect(clientReqs[0].url).toBe('/api/clients');
      expect(clientReqs[1].url).toBe('/api/clients/123');
    });

    it('clearRequests empties recorded requests', async () => {
      mockFetch.register('/api/x', { body: {} });
      await mockFetch.fetch('/api/x');
      expect(mockFetch.getRequests()).toHaveLength(1);
      mockFetch.clearRequests();
      expect(mockFetch.getRequests()).toHaveLength(0);
    });

    it('getRequests returns a copy, not a reference', async () => {
      mockFetch.register('/api/z', { body: {} });
      await mockFetch.fetch('/api/z');
      const reqs = mockFetch.getRequests();
      reqs.push({ url: '/fake', method: 'GET', headers: {}, body: null, timestamp: 0 });
      expect(mockFetch.getRequests()).toHaveLength(1); // original unmodified
    });

    it('records requests even for unmatched URLs (404)', async () => {
      await mockFetch.fetch('/unregistered/path');
      expect(mockFetch.getRequests()).toHaveLength(1);
      expect(mockFetch.getRequests()[0].url).toBe('/unregistered/path');
    });
  });

  // ─── Passthrough mode ──────────────────────────────────────────────

  describe('passthrough mode', () => {
    it('forwards to real fetch for passthrough URLs', async () => {
      const fakeFetch = vi.fn().mockResolvedValue(
        new DixieResponse(JSON.stringify({ token: 'real-jwt' }), { status: 200 })
      );
      mockFetch.setPassthrough('/api/auth/login', fakeFetch);

      const res = await mockFetch.fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ user: 'test' }),
      });
      expect(fakeFetch).toHaveBeenCalledTimes(1);
      const data = await res.json();
      expect(data).toEqual({ token: 'real-jwt' });
    });

    it('passthrough takes priority over registry', async () => {
      const fakeFetch = vi.fn().mockResolvedValue(
        new DixieResponse('"real"', { status: 200 })
      );
      mockFetch.register('/api/auth', { body: { mock: true } });
      mockFetch.setPassthrough('/api/auth', fakeFetch);

      await mockFetch.fetch('/api/auth');
      expect(fakeFetch).toHaveBeenCalledTimes(1);
    });

    it('clearPassthrough removes all passthrough routes', async () => {
      const fakeFetch = vi.fn().mockResolvedValue(new DixieResponse('"x"'));
      mockFetch.setPassthrough('/api/pass', fakeFetch);
      mockFetch.clearPassthrough();

      const res = await mockFetch.fetch('/api/pass');
      expect(res.status).toBe(404);
      expect(fakeFetch).not.toHaveBeenCalled();
    });

    it('still records the request for passthrough calls', async () => {
      const fakeFetch = vi.fn().mockResolvedValue(new DixieResponse('"ok"'));
      mockFetch.setPassthrough('/api/pt', fakeFetch);
      await mockFetch.fetch('/api/pt', { method: 'POST', body: '{"a":1}' });
      const reqs = mockFetch.getRequestsTo('/api/pt');
      expect(reqs).toHaveLength(1);
      expect(reqs[0].method).toBe('POST');
    });

    it('passthrough uses longest prefix match', async () => {
      const shortFetch = vi.fn().mockResolvedValue(new DixieResponse('"short"'));
      const longFetch = vi.fn().mockResolvedValue(new DixieResponse('"long"'));
      mockFetch.setPassthrough('/api/auth', shortFetch);
      mockFetch.setPassthrough('/api/auth/refresh', longFetch);

      await mockFetch.fetch('/api/auth/refresh/token');
      expect(longFetch).toHaveBeenCalledTimes(1);
      expect(shortFetch).not.toHaveBeenCalled();
    });
  });

  // ─── Delay simulation ─────────────────────────────────────────────

  describe('delay simulation', () => {
    it('resolves after the specified delay', async () => {
      mockFetch.register('/api/slow', { body: { data: 'late' }, delay: 50 });
      const start = Date.now();
      const res = await mockFetch.fetch('/api/slow');
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(40); // allow small timer variance
      const data = await res.json();
      expect(data).toEqual({ data: 'late' });
    });

    it('no delay by default (resolves near-instantly)', async () => {
      mockFetch.register('/api/fast', { body: { fast: true } });
      const start = Date.now();
      await mockFetch.fetch('/api/fast');
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(20);
    });
  });

  // ─── Default response ──────────────────────────────────────────────

  describe('default response', () => {
    it('returns default response for unmatched URLs', async () => {
      mockFetch.setDefaultResponse({ status: 200, body: { fallback: true } });
      const res = await mockFetch.fetch('/unknown/route');
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ fallback: true });
    });

    it('registered URLs take priority over default', async () => {
      mockFetch.setDefaultResponse({ body: { default: true } });
      mockFetch.register('/api/specific', { body: { specific: true } });

      const res = await mockFetch.fetch('/api/specific');
      const data = await res.json();
      expect(data).toEqual({ specific: true });
    });

    it('returns 404 when no default and no match', async () => {
      const res = await mockFetch.fetch('/nowhere');
      expect(res.status).toBe(404);
      expect(res.statusText).toBe('Not Found');
    });
  });

  // ─── reset() ───────────────────────────────────────────────────────

  describe('reset()', () => {
    it('clears registry, requests, passthrough, and default', async () => {
      mockFetch.register('/api/a', { body: 'a' });
      mockFetch.setDefaultResponse({ body: 'default' });
      const fakeFetch = vi.fn().mockResolvedValue(new DixieResponse('"pt"'));
      mockFetch.setPassthrough('/api/pt', fakeFetch);
      await mockFetch.fetch('/api/a');

      mockFetch.reset();

      expect(mockFetch.getRequests()).toHaveLength(0);

      // Registry cleared — returns 404
      const resA = await mockFetch.fetch('/api/a');
      expect(resA.status).toBe(404);

      // Passthrough cleared
      await mockFetch.fetch('/api/pt');
      expect(fakeFetch).not.toHaveBeenCalled();

      // Default cleared — 404 for unknown
      const resUnknown = await mockFetch.fetch('/unknown');
      expect(resUnknown.status).toBe(404);
    });
  });

  // ─── POST / PUT / PATCH with body ──────────────────────────────────

  describe('POST / PUT / PATCH with body', () => {
    it('records POST body', async () => {
      mockFetch.register('/api/items', { status: 201, body: { id: 1 } });
      await mockFetch.fetch('/api/items', {
        method: 'POST',
        body: JSON.stringify({ name: 'Widget' }),
      });
      const req = mockFetch.getRequests()[0];
      expect(req.method).toBe('POST');
      expect(req.body).toBe('{"name":"Widget"}');
    });

    it('records PUT body', async () => {
      mockFetch.register('/api/items/1', { body: { updated: true } });
      await mockFetch.fetch('/api/items/1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Widget' }),
      });
      const req = mockFetch.getRequests()[0];
      expect(req.method).toBe('PUT');
      expect(req.body).toBe('{"name":"Updated Widget"}');
    });

    it('records PATCH body', async () => {
      mockFetch.register('/api/items/1', { body: { patched: true } });
      await mockFetch.fetch('/api/items/1', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Patched' }),
      });
      const req = mockFetch.getRequests()[0];
      expect(req.method).toBe('PATCH');
    });

    it('records DELETE with no body', async () => {
      mockFetch.register('/api/items/1', { status: 204, body: null });
      await mockFetch.fetch('/api/items/1', { method: 'DELETE' });
      const req = mockFetch.getRequests()[0];
      expect(req.method).toBe('DELETE');
      expect(req.body).toBeNull();
    });
  });

  // ─── Edge cases ────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('fetch with DixieRequest object instead of string', async () => {
      mockFetch.register('/api/req-obj', { body: { fromObj: true } });
      const req = new DixieRequest('/api/req-obj', { method: 'GET' });
      const res = await mockFetch.fetch(req);
      const data = await res.json();
      expect(data).toEqual({ fromObj: true });
    });

    it('response URL is set to the fetched URL', async () => {
      mockFetch.register('/api/url-check', { body: {} });
      const res = await mockFetch.fetch('/api/url-check');
      expect(res.url).toBe('/api/url-check');
    });

    it('null body response returns null-body response', async () => {
      mockFetch.register('/api/empty', { status: 204, body: null });
      const res = await mockFetch.fetch('/api/empty');
      expect(res.status).toBe(204);
      const text = await res.text();
      expect(text).toBe('');
    });

    it('handles empty string body in config', async () => {
      mockFetch.register('/api/empty-str', { body: '' });
      const res = await mockFetch.fetch('/api/empty-str');
      const text = await res.text();
      // Empty string is JSON-stringified to '""'
      expect(text).toBe('""');
    });

    it('handles numeric body in config', async () => {
      mockFetch.register('/api/num', { body: 42 });
      const res = await mockFetch.fetch('/api/num');
      const data = await res.json();
      expect(data).toBe(42);
    });

    it('handles array body in config', async () => {
      mockFetch.register('/api/arr', { body: [1, 2, 3] });
      const res = await mockFetch.fetch('/api/arr');
      const data = await res.json();
      expect(data).toEqual([1, 2, 3]);
    });

    it('handles boolean body in config', async () => {
      mockFetch.register('/api/bool', { body: true });
      const res = await mockFetch.fetch('/api/bool');
      const data = await res.json();
      expect(data).toBe(true);
    });

    it('multiple registrations to same pattern overwrite', async () => {
      mockFetch.register('/api/overwrite', { body: { version: 1 } });
      mockFetch.register('/api/overwrite', { body: { version: 2 } });
      const res = await mockFetch.fetch('/api/overwrite');
      const data = await res.json();
      expect(data).toEqual({ version: 2 });
    });
  });
});
