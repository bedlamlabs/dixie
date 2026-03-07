/**
 * RenderHarness — the main API for rendering in Dixie.
 *
 * Wraps RenderContext with convenient methods for common render operations.
 * Handles setup (tokens, localStorage, mock routes, noise patterns) and
 * teardown automatically.
 */

import { RenderContext } from './RenderContext';
import type { RenderResult } from './RenderContext';

// ── Public types ──────────────────────────────────────────────────────

export interface RenderOptions {
  /** Mock API routes: URL pattern -> response body (or MockResponseConfig) */
  mockRoutes?: Record<string, any>;

  /** Auth tokens to inject into localStorage */
  tokens?: { user?: string; admin?: string };

  /** Initial localStorage data */
  localStorage?: Record<string, string>;

  /** Console noise patterns (additional to defaults) */
  noisePatterns?: (string | RegExp)[];

  /** Performance budget */
  budget?: {
    totalMs?: number;
    renderMs?: number;
  };
}

// ── RenderHarness ─────────────────────────────────────────────────────

export class RenderHarness {
  /**
   * Render HTML content at a specific route path.
   */
  renderRoute(path: string, html: string, options?: RenderOptions): RenderResult {
    const ctx = this._createContext(options);

    try {
      // Navigate first, then set content
      ctx.navigate(path);
      ctx.setContent(html);

      return ctx.getResult();
    } finally {
      ctx.destroy();
    }
  }

  /**
   * Render isolated HTML content (no routing).
   */
  renderHTML(html: string, options?: RenderOptions): RenderResult {
    const ctx = this._createContext(options);

    try {
      ctx.setContent(html);
      return ctx.getResult();
    } finally {
      ctx.destroy();
    }
  }

  /**
   * Batch render: render multiple routes and return all results.
   * Each route gets its own isolated RenderContext.
   */
  renderBatch(
    routes: Array<{ path: string; html: string; options?: RenderOptions }>,
  ): RenderResult[] {
    return routes.map((route) => this.renderRoute(route.path, route.html, route.options));
  }

  /**
   * Quick smoke test: render and check for basic health.
   * Returns pass/fail with a list of failure reasons.
   */
  smokeTest(
    path: string,
    html: string,
    options?: RenderOptions,
  ): { passed: boolean; failures: string[] } {
    const result = this.renderRoute(path, html, options);
    const failures: string[] = [];

    // Check 1: Body has content
    if (result.dom.bodyHTML.trim().length === 0) {
      failures.push('Body is empty — nothing was rendered');
    }

    // Check 2: No console errors
    if (result.console.errors.length > 0) {
      failures.push(
        `${result.console.errors.length} console error(s): ${result.console.errors[0]}`,
      );
    }

    // Check 3: Performance budget
    if (options?.budget) {
      if (options.budget.totalMs && result.timing.totalMs > options.budget.totalMs) {
        failures.push(
          `Total time ${result.timing.totalMs}ms exceeded budget of ${options.budget.totalMs}ms`,
        );
      }
      if (options.budget.renderMs && result.timing.renderMs > options.budget.renderMs) {
        failures.push(
          `Render time ${result.timing.renderMs}ms exceeded budget of ${options.budget.renderMs}ms`,
        );
      }
    }

    return {
      passed: failures.length === 0,
      failures,
    };
  }

  /**
   * Destroy (no-op for stateless harness, but present for API symmetry).
   */
  destroy(): void {
    // RenderHarness is stateless — each render creates/destroys its own context.
    // This method exists for API consistency and future extension.
  }

  // ── Private helpers ───────────────────────────────────────────────

  private _createContext(options?: RenderOptions): RenderContext {
    const ctx = new RenderContext({
      mockRoutes: options?.mockRoutes,
    });

    // Apply tokens to localStorage
    if (options?.tokens) {
      if (options.tokens.user) {
        ctx.env.localStorage.setItem('token', options.tokens.user);
      }
      if (options.tokens.admin) {
        ctx.env.localStorage.setItem('admin_token', options.tokens.admin);
      }
    }

    // Apply localStorage data
    if (options?.localStorage) {
      for (const [key, value] of Object.entries(options.localStorage)) {
        ctx.env.localStorage.setItem(key, value);
      }
    }

    // Apply additional noise patterns
    if (options?.noisePatterns) {
      for (const pattern of options.noisePatterns) {
        ctx.console.addNoisePattern(pattern);
      }
    }

    return ctx;
  }
}
