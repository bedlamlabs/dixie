/**
 * MockFetch — Endpoint-aware mock fetch for the Dixie CLI browser.
 *
 * Features:
 * - Per-URL response registry with longest-prefix matching
 * - Function handlers for dynamic responses based on request method/body
 * - Request recording (all calls logged with url, method, headers, body, timestamp)
 * - Delay simulation (async resolution after N ms)
 * - Passthrough mode (forward specific URLs to a real fetch function)
 * - Default response for unmatched URLs (404 if none configured)
 */

import { DixieHeaders } from './Headers';
import { DixieRequest, type DixieRequestInit } from './Request';
import { DixieResponse } from './Response';

// ─── Public types ────────────────────────────────────────────────────

export interface MockResponseConfig {
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: any;
  delay?: number;
}

export type MockResponseHandler = (request: DixieRequest) => MockResponseConfig;

export interface RecordedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
  timestamp: number;
}

// ─── Sorted entry for prefix matching ────────────────────────────────

interface SortedEntry<V> {
  pattern: string;
  value: V;
}

// ─── Pre-built 404 response config (reused across all instances) ─────

const FALLBACK_404: MockResponseConfig = Object.freeze({ status: 404, statusText: 'Not Found', body: null });

// ─── Implementation ──────────────────────────────────────────────────

export class MockFetch {
  private _registry: Map<string, MockResponseConfig | MockResponseHandler> = new Map();
  /** Registry entries sorted by pattern length descending (longest first) */
  private _registrySorted: SortedEntry<MockResponseConfig | MockResponseHandler>[] = [];
  private _registryDirty = false;

  private _requests: RecordedRequest[] = [];
  private _maxRecordedRequests: number;

  private _passthroughMap: Map<string, (input: string | DixieRequest, init?: DixieRequestInit) => Promise<DixieResponse>> = new Map();
  /** Passthrough entries sorted by pattern length descending (longest first) */
  private _passthroughSorted: SortedEntry<(input: string | DixieRequest, init?: DixieRequestInit) => Promise<DixieResponse>>[] = [];
  private _passthroughDirty = false;

  private _defaultResponse: MockResponseConfig | null = null;

  /** Cache: body config identity → pre-stringified JSON */
  private _bodyCache: WeakMap<object, string> = new WeakMap();

  constructor(options?: { maxRecordedRequests?: number }) {
    this._maxRecordedRequests = options?.maxRecordedRequests ?? 10000;
  }

  // ─── Response registry ───────────────────────────────────────────

  register(urlPattern: string, response: MockResponseConfig | MockResponseHandler): void {
    this._registry.set(urlPattern, response);
    this._registryDirty = true;
  }

  unregister(urlPattern: string): void {
    this._registry.delete(urlPattern);
    this._registryDirty = true;
  }

  clearRegistry(): void {
    this._registry.clear();
    this._registrySorted.length = 0;
    this._registryDirty = false;
  }

  // ─── Default response ────────────────────────────────────────────

  setDefaultResponse(response: MockResponseConfig): void {
    this._defaultResponse = response;
  }

  // ─── Passthrough ─────────────────────────────────────────────────

  setPassthrough(urlPattern: string, realFetch: (...args: any[]) => Promise<any>): void {
    this._passthroughMap.set(urlPattern, realFetch as any);
    this._passthroughDirty = true;
  }

  clearPassthrough(): void {
    this._passthroughMap.clear();
    this._passthroughSorted.length = 0;
    this._passthroughDirty = false;
  }

  // ─── Request recording ───────────────────────────────────────────

  getRequests(): RecordedRequest[] {
    return [...this._requests];
  }

  getRequestsTo(urlPattern: string): RecordedRequest[] {
    return this._requests.filter((r) => r.url.startsWith(urlPattern));
  }

  clearRequests(): void {
    this._requests.length = 0;
  }

  // ─── Reset ───────────────────────────────────────────────────────

  reset(): void {
    this.clearRegistry();
    this.clearRequests();
    this.clearPassthrough();
    this._defaultResponse = null;
  }

  // ─── Core fetch ──────────────────────────────────────────────────

  async fetch(input: string | DixieRequest, init?: DixieRequestInit): Promise<DixieResponse> {
    // Guard: SPA code may call fetch() with undefined/null (broken dynamic imports,
    // conditional API calls with unset URLs). Return 400 instead of crashing.
    if (input == null) {
      return this._buildResponse({ status: 400, statusText: 'Bad Request', body: null }, '');
    }

    // Fast path: avoid DixieRequest + DixieHeaders creation for string URLs
    const isString = typeof input === 'string';
    const url = isString ? input : input.url;

    // Light recording — no DixieHeaders allocation for string inputs
    if (this._requests.length < this._maxRecordedRequests) {
      if (isString) {
        let headersRec: Record<string, string> = {};
        if (init?.headers) {
          if (init.headers instanceof DixieHeaders) {
            init.headers.forEach((v, k) => { headersRec[k] = v; });
          } else if (typeof init.headers === 'object' && !Array.isArray(init.headers)) {
            for (const k of Object.keys(init.headers)) { headersRec[k.toLowerCase()] = init.headers[k]; }
          }
        }
        this._requests.push({
          url,
          method: init?.method?.toUpperCase() ?? 'GET',
          headers: headersRec,
          body: init?.body ?? null,
          timestamp: Date.now(),
        });
      } else {
        const headersRecord: Record<string, string> = {};
        input.headers.forEach((value, key) => { headersRecord[key] = value; });
        this._requests.push({
          url,
          method: input.method,
          headers: headersRecord,
          body: input.body,
          timestamp: Date.now(),
        });
      }
    }

    // 1. Check passthrough (longest prefix match via sorted array)
    if (this._passthroughMap.size > 0) {
      const ptMatch = this._findLongestMatchSorted(url, this._getPassthroughSorted());
      if (ptMatch !== null) {
        return ptMatch(input, init);
      }
    }

    // 2. Check registry — exact match first (O(1)), then prefix match
    if (this._registry.size > 0) {
      let regMatch: MockResponseConfig | MockResponseHandler | null = this._registry.get(url) ?? null;
      if (regMatch === null) {
        regMatch = this._findLongestMatchSorted(url, this._getRegistrySorted());
      }
      if (regMatch !== null) {
        if (typeof regMatch === 'function') {
          // Handler needs a DixieRequest — create lazily
          const request = isString ? new DixieRequest(input, init) : input;
          return this._buildResponse(regMatch(request), url);
        }
        return this._buildResponse(regMatch, url);
      }
    }

    // 3. Default response
    if (this._defaultResponse !== null) {
      return this._buildResponse(this._defaultResponse, url);
    }

    // 4. 404 fallback
    return this._buildResponse(FALLBACK_404, url);
  }

  // ─── Helpers ─────────────────────────────────────────────────────

  /** Rebuild the sorted registry array if dirty */
  private _getRegistrySorted(): SortedEntry<MockResponseConfig | MockResponseHandler>[] {
    if (this._registryDirty) {
      this._registrySorted = this._buildSorted(this._registry);
      this._registryDirty = false;
    }
    return this._registrySorted;
  }

  /** Rebuild the sorted passthrough array if dirty */
  private _getPassthroughSorted(): SortedEntry<(input: string | DixieRequest, init?: DixieRequestInit) => Promise<DixieResponse>>[] {
    if (this._passthroughDirty) {
      this._passthroughSorted = this._buildSorted(this._passthroughMap) as any;
      this._passthroughDirty = false;
    }
    return this._passthroughSorted;
  }

  /** Build a sorted array from a Map, longest patterns first */
  private _buildSorted<V>(map: Map<string, V>): SortedEntry<V>[] {
    const arr: SortedEntry<V>[] = [];
    for (const [pattern, value] of map) {
      arr.push({ pattern, value });
    }
    arr.sort((a, b) => b.pattern.length - a.pattern.length);
    return arr;
  }

  /** Find the longest matching prefix from a pre-sorted array (longest first).
   *  Returns the value directly, or null if no match. */
  private _findLongestMatchSorted<V>(url: string, sorted: SortedEntry<V>[]): V | null {
    for (let i = 0; i < sorted.length; i++) {
      if (url.startsWith(sorted[i].pattern)) {
        return sorted[i].value;
      }
    }
    return null;
  }

  private async _buildResponse(config: MockResponseConfig, url: string): Promise<DixieResponse> {
    const delay = config.delay ?? 0;
    if (delay > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, delay));
    }

    let body: string | null;
    const rawBody = config.body;
    if (rawBody !== undefined && rawBody !== null) {
      // Use body cache for object/array bodies (avoids re-stringifying identical configs)
      if (typeof rawBody === 'object') {
        let cached = this._bodyCache.get(rawBody);
        if (cached === undefined) {
          cached = JSON.stringify(rawBody);
          this._bodyCache.set(rawBody, cached);
        }
        body = cached;
      } else {
        body = JSON.stringify(rawBody);
      }
    } else {
      body = null;
    }

    const headers: Record<string, string> = config.headers ? { ...config.headers } : {};
    if (body !== null && !headers['content-type']) {
      headers['content-type'] = 'application/json';
    }

    return new DixieResponse(body, {
      status: config.status ?? 200,
      statusText: config.statusText ?? 'OK',
      headers,
      url,
    });
  }

  /**
   * Create a MockFetch pre-loaded with responses from a HAR entries array.
   * Each HAR entry is registered as a mock route keyed by request URL.
   * Used by mock-replay to replay recorded network sessions.
   */
  static loadFromHar(entries: any[]): MockFetch {
    const instance = new MockFetch();
    for (const entry of entries) {
      const url = entry.request?.url ?? entry.url;
      const method = entry.request?.method ?? entry.method ?? 'GET';
      const status = entry.response?.status ?? entry.status ?? 200;
      const body = entry.response?.content?.text ?? entry.responseBody ?? '';
      const contentType = entry.response?.content?.mimeType ?? 'application/json';
      if (url) {
        instance.register(url, {
          status,
          body,
          headers: { 'content-type': contentType },
        });
      }
    }
    return instance;
  }
}
