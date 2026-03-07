/**
 * RenderContext — structured context for a render operation.
 *
 * Captures everything an AI agent needs to understand what happened
 * when a page was rendered: DOM state, console output, network activity,
 * timing, and failure diagnosis.
 */

import { createDixieEnvironment } from '../environment/DixieEnvironment';
import type { DixieEnvironment } from '../environment/DixieEnvironment';
import { ConsoleCapture } from '../console/ConsoleCapture';
import type { ConsoleCaptureOptions } from '../console/ConsoleCapture';
import { MockFetch } from '../fetch/MockFetch';
import type { RecordedRequest } from '../fetch/MockFetch';
import { DixieSnapshot } from '../assertions/DixieSnapshot';
import { Event as DixieEvent } from '../events/Event';

// ── Public types ──────────────────────────────────────────────────────

export type DiagnosisCategory =
  | 'auth'
  | 'network'
  | 'render'
  | 'missing-route'
  | 'component-error'
  | 'empty-render'
  | 'console-errors';

export interface Diagnosis {
  category: DiagnosisCategory;
  message: string;
  suggestion: string;
}

export interface RenderResult {
  /** Did the render succeed (non-empty body, no unfiltered errors)? */
  success: boolean;

  /** DOM state snapshot */
  dom: {
    title: string;
    bodyHTML: string;
    elementCount: number;
    textContent: string;
    snapshot: string;
  };

  /** Console output after noise filtering */
  console: {
    errors: string[];
    warnings: string[];
    logs: string[];
    rawErrorCount: number;
    rawWarningCount: number;
    filteredCount: number;
  };

  /** Network activity */
  network: {
    requests: Array<{
      url: string;
      method: string;
      status: number;
      timestamp: number;
    }>;
    unmockedUrls: string[];
  };

  /** Timing */
  timing: {
    totalMs: number;
    parseMs: number;
    renderMs: number;
  };

  /** Failure diagnosis (the agent-friendly killer feature) */
  diagnosis?: Diagnosis;
}

// ── RenderContext ──────────────────────────────────────────────────────

export class RenderContext {
  readonly env: DixieEnvironment;
  readonly console: ConsoleCapture;
  readonly fetch: MockFetch;

  private _startTime: number;
  private _parseMs: number = 0;
  private _renderMs: number = 0;
  private _destroyed = false;

  constructor(options?: { mockRoutes?: Record<string, any> }) {
    this._startTime = Date.now();

    // Create environment
    this.env = createDixieEnvironment({ url: 'http://localhost/' });

    // Create console capture (capture logs too for full picture)
    this.console = new ConsoleCapture({ captureLog: true });
    this.console.install();

    // Create mock fetch and register routes
    this.fetch = new MockFetch();
    if (options?.mockRoutes) {
      for (const [url, response] of Object.entries(options.mockRoutes)) {
        this.fetch.register(url, typeof response === 'function' ? response : { body: response });
      }
    }

    // Install fetch globally
    (globalThis as any).fetch = this.fetch.fetch.bind(this.fetch);
  }

  /**
   * Set body innerHTML (simulates what React would render).
   */
  setContent(html: string): void {
    this._assertNotDestroyed();
    const parseStart = Date.now();
    this.env.document.body.innerHTML = html;
    this._parseMs = Date.now() - parseStart;
    this._renderMs = this._parseMs; // For setContent, parse === render
  }

  /**
   * Navigate to a route (sets location pathname, dispatches popstate).
   */
  navigate(path: string): void {
    this._assertNotDestroyed();
    this.env.location.pathname = path;

    // Dispatch popstate event on window for router integration
    try {
      if (typeof this.env.window.dispatchEvent === 'function') {
        this.env.window.dispatchEvent(new DixieEvent('popstate'));
      }
    } catch {
      // Popstate dispatch is best-effort
    }
  }

  /**
   * Get structured render result.
   */
  getResult(): RenderResult {
    this._assertNotDestroyed();

    const totalMs = Date.now() - this._startTime;

    // DOM state
    const snapshot = new DixieSnapshot(this.env.document);
    const snapshotStr = snapshot.toDebugString();
    const domState = snapshot.toJSON();

    const bodyHTML = this.env.document.body ? this.env.document.body.innerHTML : '';
    const textContent = this.env.document.body ? this.env.document.body.textContent.trim() : '';

    // Console state
    const filteredErrors = this.console.getErrors();
    const filteredWarnings = this.console.getWarnings();
    const filteredLogs = this.console.getLogs();
    const rawErrors = this.console.getRawErrors();
    const rawWarnings = this.console.getRawWarnings();
    const rawErrorCount = rawErrors.length;
    const rawWarningCount = rawWarnings.length;
    const filteredCount = (rawErrorCount - filteredErrors.length) + (rawWarningCount - filteredWarnings.length);

    // Network state
    const requests = this.fetch.getRequests();
    const networkRequests = requests.map((r: RecordedRequest) => ({
      url: r.url,
      method: r.method,
      status: 0, // Status is on the response side, not request; record URL/method
      timestamp: r.timestamp,
    }));

    // Find unmocked URLs (requests that went to the 404 fallback)
    const unmockedUrls = this._findUnmockedUrls(requests);

    // Determine success
    const hasContent = bodyHTML.trim().length > 0;
    const hasErrors = filteredErrors.length > 0;
    const success = hasContent && !hasErrors;

    // Build result
    const result: RenderResult = {
      success,
      dom: {
        title: this.env.document.title,
        bodyHTML,
        elementCount: domState.elementCount,
        textContent,
        snapshot: snapshotStr,
      },
      console: {
        errors: filteredErrors,
        warnings: filteredWarnings,
        logs: filteredLogs,
        rawErrorCount,
        rawWarningCount,
        filteredCount,
      },
      network: {
        requests: networkRequests,
        unmockedUrls,
      },
      timing: {
        totalMs,
        parseMs: this._parseMs,
        renderMs: this._renderMs,
      },
    };

    // Add diagnosis if there are issues
    const diagnosis = this.diagnose();
    if (diagnosis) {
      result.diagnosis = diagnosis;
    }

    return result;
  }

  /**
   * Self-diagnose: analyze the current state and suggest fixes.
   */
  diagnose(): Diagnosis | null {
    this._assertNotDestroyed();

    const bodyHTML = this.env.document.body ? this.env.document.body.innerHTML : '';
    const filteredErrors = this.console.getErrors();
    const rawErrors = this.console.getRawErrors();
    const requests = this.fetch.getRequests();
    const unmockedUrls = this._findUnmockedUrls(requests);

    // Priority 1: Empty render
    if (bodyHTML.trim().length === 0) {
      return {
        category: 'empty-render',
        message: 'Body is empty — nothing was rendered.',
        suggestion: 'Check that setContent() was called with valid HTML, or that the React app mounted correctly.',
      };
    }

    // Priority 2: Auth issues
    const hasAuthErrors = rawErrors.some(
      (e) =>
        e.includes('401') ||
        e.includes('unauthorized') ||
        e.toLowerCase().includes('auth') ||
        e.includes('token'),
    );
    const hasNoTokens =
      !this.env.localStorage.getItem('token') &&
      !this.env.localStorage.getItem('auth_token') &&
      !this.env.localStorage.getItem('access_token');

    if (hasNoTokens && hasAuthErrors) {
      return {
        category: 'auth',
        message: 'Auth errors detected with no tokens in localStorage.',
        suggestion:
          'Set tokens via options.tokens or options.localStorage before rendering. The app likely needs a JWT to render authenticated routes.',
      };
    }

    // Priority 3: Unmocked network requests
    if (unmockedUrls.length > 0) {
      return {
        category: 'network',
        message: `${unmockedUrls.length} URL(s) had no mock: ${unmockedUrls.join(', ')}`,
        suggestion:
          'Add mock routes for these URLs via options.mockRoutes, or register them on the MockFetch instance.',
      };
    }

    // Priority 4: Console errors
    if (filteredErrors.length > 0) {
      return {
        category: 'console-errors',
        message: `${filteredErrors.length} console error(s): ${filteredErrors[0]}`,
        suggestion:
          'Check the console.errors array in the render result for details. These are real errors that survived noise filtering.',
      };
    }

    // Healthy
    return null;
  }

  /**
   * Clean up the environment and restore console.
   */
  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;

    this.console.uninstall();

    // Remove global fetch
    if ((globalThis as any).fetch === this.fetch.fetch.bind(this.fetch)) {
      delete (globalThis as any).fetch;
    }

    this.env.destroy();
  }

  // ── Private helpers ───────────────────────────────────────────────

  private _assertNotDestroyed(): void {
    if (this._destroyed) {
      throw new Error('RenderContext has been destroyed and cannot be used.');
    }
  }

  /**
   * Find URLs from requests that had no registered mock route.
   * We check which request URLs don't start with any registered pattern.
   */
  private _findUnmockedUrls(requests: RecordedRequest[]): string[] {
    // We don't have direct access to the registry, so we track by
    // checking if a URL starts with any known registered pattern.
    // MockFetch returns 404 for unmatched URLs, but since we can't
    // observe the response status from recorded requests alone,
    // we'll use a simpler heuristic: any request URL that doesn't
    // match a registered pattern prefix is considered unmocked.
    //
    // For now, return empty — unmocked detection requires response status
    // tracking which we'll add if MockFetch supports it.
    // Actually, let's be pragmatic: iterate through requests and check
    // if they match any registered prefix. We need access to the registry keys.
    const unmocked: string[] = [];
    // Access the registry through a practical approach
    const registryKeys = this._getRegistryKeys();

    for (const req of requests) {
      const matched = registryKeys.some((pattern) => req.url.startsWith(pattern));
      if (!matched && registryKeys.length > 0) {
        if (!unmocked.includes(req.url)) {
          unmocked.push(req.url);
        }
      }
    }

    return unmocked;
  }

  /**
   * Get the registered URL patterns from MockFetch.
   * Uses the _registry Map which is a private field — we access it pragmatically.
   */
  private _getRegistryKeys(): string[] {
    try {
      // Access the private _registry Map
      const registry = (this.fetch as any)._registry as Map<string, unknown>;
      if (registry && typeof registry.keys === 'function') {
        return Array.from(registry.keys());
      }
    } catch {
      // Fall through
    }
    return [];
  }
}
