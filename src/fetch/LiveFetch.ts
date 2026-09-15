/**
 * LiveFetch — thin wrapper around globalThis.fetch() for real network access.
 *
 * Injects User-Agent, Origin, and Referer headers on every outbound request.
 * Records all requests for debugging and contract validation.
 * Caches script content by URL at the promise level (concurrent requests
 * for the same URL coalesce into a single network call).
 *
 * This is NOT built on MockFetch. MockFetch fakes responses; LiveFetch
 * wraps real network with header injection + recording.
 */

import type { RecordedRequest } from './MockFetch';
import { dixieFetch } from './loopback';

// ── Types ─────────────────────────────────────────────────────────────

export interface LiveFetchOptions {
  pageUrl: string;
  userAgent: string;
  maxRecordedRequests?: number;
}

// ── Implementation ────────────────────────────────────────────────────

export class LiveFetch {
  private _origin: string;
  private _referer: string;
  private _userAgent: string;
  private _requests: RecordedRequest[] = [];
  private _maxRecordedRequests: number;

  /** Promise-level cache for fetchText — same URL deduplicates automatically */
  private _textCache: Map<string, Promise<string>> = new Map();

  constructor(options: LiveFetchOptions) {
    this._userAgent = options.userAgent;
    this._maxRecordedRequests = options.maxRecordedRequests ?? 10000;

    // Derive Origin and Referer from the page URL
    try {
      const parsed = new URL(options.pageUrl);
      this._origin = parsed.origin;
      this._referer = options.pageUrl;
    } catch {
      this._origin = '';
      this._referer = options.pageUrl;
    }
  }

  // ── Core fetch ──────────────────────────────────────────────────────

  async fetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
    // RequestInfo may be a string, a URL object, or a Request. Vite's
    // modulepreload polyfill passes link.href; other code passes URL objects.
    const isRequest = typeof input === 'object' && input !== null && !(input instanceof URL) && 'url' in input;
    // Relative URLs resolve against the page, as in a browser.
    let url = isRequest ? (input as Request).url : String(input);
    try {
      url = new URL(url, this._referer || undefined).href;
    } catch {
      // Leave unparseable input as-is; fetch reports the error.
    }
    const method = init?.method?.toUpperCase() ?? (isRequest ? (input as Request).method ?? 'GET' : 'GET');

    // Build headers — inject UA/Origin/Referer without clobbering caller's headers
    const headers = new Headers(init?.headers ?? (isRequest ? (input as Request).headers : undefined));
    if (!headers.has('User-Agent')) headers.set('User-Agent', this._userAgent);
    if (!headers.has('Origin') && this._origin) headers.set('Origin', this._origin);
    if (!headers.has('Referer') && this._referer) headers.set('Referer', this._referer);

    // Record request
    if (this._requests.length < this._maxRecordedRequests) {
      const headersRecord: Record<string, string> = {};
      headers.forEach((v, k) => { headersRecord[k] = v; });
      this._requests.push({
        url,
        method,
        headers: headersRecord,
        body: init?.body as string ?? null,
        timestamp: Date.now(),
      });
    }

    // Delegate to native fetch (loopback hosts resolve without DNS, as in browsers)
    return dixieFetch(isRequest ? input : url, { ...init, headers });
  }

  // ── Script fetching with cache ──────────────────────────────────────

  /**
   * Fetch a script URL and return its text content.
   * Results are cached at the promise level — concurrent calls for the
   * same URL share a single network request.
   */
  fetchText(url: string, options?: { timeout?: number }): Promise<string> {
    const cached = this._textCache.get(url);
    if (cached) return cached;

    const promise = this._fetchTextUncached(url, options?.timeout);
    this._textCache.set(url, promise);
    return promise;
  }

  private async _fetchTextUncached(url: string, timeout?: number): Promise<string> {
    const controller = timeout ? new AbortController() : undefined;
    const timer = controller ? setTimeout(() => controller.abort(), timeout) : undefined;

    try {
      const response = await this.fetch(url, {
        signal: controller?.signal,
      });
      return await response.text();
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  // ── Request recording ───────────────────────────────────────────────

  getRequests(): RecordedRequest[] {
    return [...this._requests];
  }

  getRequestsTo(urlPattern: string): RecordedRequest[] {
    return this._requests.filter((r) => r.url.startsWith(urlPattern));
  }

  clearRequests(): void {
    this._requests.length = 0;
  }

  clearCache(): void {
    this._textCache.clear();
  }

  reset(): void {
    this.clearRequests();
    this.clearCache();
  }
}
