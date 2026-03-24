import type { ParsedArgs, CommandResult, DixieConfig } from '../types';
import { createDixieEnvironment } from '../../environment';
import { createVmContext } from '../../execution/vm-context';
import { loadScripts } from '../../execution/script-loader';
import { flushReactRender } from '../../execution/event-loop-flush';
import { resolveConfig } from '../config-loader';
import { formatOutput } from '../format';
import type { HarRecorder } from '../../har/recorder';
import * as path from 'node:path';

export interface RenderOptions {
  token?: string;
  config?: DixieConfig;
  timeout?: number;
  noJs?: boolean;
  /** Explicit path to a dixie config file — errors thrown (not swallowed) */
  configPath?: string;
  /** HAR recorder to capture the initial HTML fetch */
  harRecorder?: HarRecorder;
}

export interface RenderResult {
  document: any;
  meta: {
    url: string;
    renderMs: number;
    parseMs: number;
    configSource: string;
    tokenSource?: string;
    tokenValue?: string;
    auth?: { status: string; reason?: string };
  };
  errors: Array<{ code: string; message: string }>;
  /** Flush the event loop so React can settle after interactions (click, type). */
  flush: (options?: { timeoutMs?: number; stableRounds?: number; waitForSelector?: string }) => Promise<{ stable: boolean; elementCount: number; rounds: number }>;
}

export async function renderUrl(url: string, options?: RenderOptions): Promise<RenderResult> {
  const start = performance.now();
  const errors: Array<{ code: string; message: string }> = [];

  // Determine config source
  let config: DixieConfig | null = options?.config ?? null;
  let configSource = 'defaults';

  if (!config && !url.startsWith('data:')) {
    if (options?.configPath) {
      // Explicit config path — let errors propagate (user error if path is wrong)
      config = await resolveConfig(url, process.cwd(), options.configPath);
      configSource = 'file';
    } else {
      try {
        config = await resolveConfig(url, process.cwd());
        if (config) configSource = 'file';
      } catch {
        configSource = 'defaults';
      }
    }
  }

  // Determine token
  let token: string | undefined = options?.token;
  let tokenSource: string | undefined;
  let tokenValue: string | undefined;
  let authMeta: { status: string; reason?: string } | undefined;

  if (token) {
    tokenSource = 'provided';
    tokenValue = token;
  } else if (config?.auth) {
    // Try to acquire token from config auth
    try {
      const { TokenAcquisition } = await import('../../auth');
      const ta = new TokenAcquisition(config.auth);
      const result = await ta.acquire();
      if (result.userToken && result.source === 'live') {
        token = result.userToken;
        tokenSource = 'config';
      } else if (result.source === 'mock' && result.error) {
        // Auth server unreachable — continue without auth
        authMeta = { status: 'failed', reason: result.error };
      }
    } catch (err: any) {
      // Auth module error — continue without auth
      authMeta = { status: 'failed', reason: err.message ?? String(err) };
    }
  }

  // Fetch HTML
  let html: string;
  const parseStart = performance.now();

  if (url.startsWith('data:text/html,')) {
    html = decodeURIComponent(url.slice('data:text/html,'.length));
  } else if (url.startsWith('data:')) {
    html = '';
  } else {
    // Wrap globalThis.fetch temporarily if a HAR recorder is provided so it
    // can intercept the initial HTML fetch (renderUrl uses raw fetch here, not MockFetch)
    const originalFetch = (globalThis as any).fetch;
    if (options?.harRecorder) {
      const recorder = options.harRecorder;
      (globalThis as any).fetch = async (reqUrl: string, reqOpts?: any) => {
        const fetchStart = performance.now();
        const resp = await originalFetch(reqUrl, reqOpts);
        const durationMs = performance.now() - fetchStart;
        const responseBody = await resp.text();
        recorder.record({
          method: reqOpts?.method ?? 'GET',
          url: reqUrl,
          status: resp.status,
          responseBody,
          durationMs,
        });
        return new Response(responseBody, {
          status: resp.status,
          statusText: resp.statusText ?? '',
          headers: resp.headers,
        });
      };
    }

    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(url, { headers });
      html = await response.text();
    } catch (err: any) {
      const error = new Error(`Could not reach ${url}: ${err.message}`);
      (error as any).code = 'FETCH_FAILED';
      throw error;
    } finally {
      // Restore original fetch whether or not an error occurred
      if (options?.harRecorder) {
        (globalThis as any).fetch = originalFetch;
      }
    }
  }

  const parseMs = performance.now() - parseStart;

  // Create environment and parse HTML
  const ctx = createVmContext({ timeout: options?.timeout ?? 5000, url, harRecorder: options?.harRecorder });

  // Set up API passthrough for SPA pages — forward in-page fetch calls to the
  // real server so React can authenticate, load data, and render actual content.
  // Without this, MockFetch returns 404 for all API calls and React renders the
  // login page instead of the requested route.
  if (!url.startsWith('data:')) {
    try {
      const origin = new URL(url).origin;
      const passthroughFetch = async (input: any, init?: any) => {
        const reqUrl = typeof input === 'string' ? input : input?.url ?? String(input);
        // Resolve relative URLs against the page origin
        const fullUrl = reqUrl.startsWith('/') ? `${origin}${reqUrl}` : reqUrl;
        const headers: Record<string, string> = { ...(init?.headers ?? {}) };
        if (token && !headers['Authorization'] && !headers['authorization']) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await globalThis.fetch(fullUrl, { ...init, headers });
        const body = await response.text();
        // Import DixieResponse to return the correct type for MockFetch
        const { DixieResponse } = await import('../../fetch/Response');
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((v: string, k: string) => { responseHeaders[k] = v; });
        return new DixieResponse(body, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          url: fullUrl,
        });
      };
      // Forward same-origin API calls and relative URLs to the real server
      ctx.mockFetch.setPassthrough(origin, passthroughFetch);
      ctx.mockFetch.setPassthrough('/', passthroughFetch);
    } catch {
      // URL parsing failed — skip passthrough (non-standard URL)
    }
  }

  // Parse full HTML document structure
  // Extract head/body content and title from the raw HTML
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  if (headMatch) {
    ctx.document.head.innerHTML = headMatch[1];
  }
  if (bodyMatch) {
    ctx.document.body.innerHTML = bodyMatch[1];
  } else {
    // No <body> tag — treat entire HTML as body content
    ctx.document.body.innerHTML = html;
  }
  if (titleMatch) {
    ctx.document.title = titleMatch[1].trim();
  }

  // Pre-seed storage from config BEFORE scripts execute.
  // SPAs read auth tokens from localStorage/sessionStorage. Without pre-seeding,
  // the app sees empty storage and renders the login page.
  if (config?.preseed?.localStorage && ctx.sandbox?.localStorage) {
    for (const [key, value] of Object.entries(config.preseed.localStorage)) {
      // Replace {{token}} placeholder with the acquired auth token
      ctx.sandbox.localStorage.setItem(key, value === '{{token}}' ? (token ?? '') : value);
    }
  }
  if (config?.preseed?.sessionStorage && ctx.sandbox?.sessionStorage) {
    for (const [key, value] of Object.entries(config.preseed.sessionStorage)) {
      ctx.sandbox.sessionStorage.setItem(key, value === '{{token}}' ? (token ?? '') : value);
    }
  }

  // Execute scripts unless --no-js
  if (options?.noJs) {
    // Strip script tags from the DOM when JS is disabled
    const scripts = ctx.document.querySelectorAll('script');
    for (const script of scripts) {
      script.parentNode?.removeChild(script);
    }
  } else {
    const scriptDeadline = Date.now() + (options?.timeout ?? 5000);

    // Capture async errors during script execution and React flush.
    // React's async scheduler (MessageChannel) throws errors that propagate as
    // uncaught exceptions (via process.nextTick in Node's EventTarget) AND as
    // unhandled rejections. Without handlers for BOTH, a React error like
    // "useAuth must be used within AuthProvider" crashes the Node.js process.
    const asyncErrors: Array<{ code: string; message: string }> = [];
    const errorHandler = (err: any) => {
      const msg = err?.message ?? String(err);
      asyncErrors.push({ code: 'SCRIPT_ASYNC_ERROR', message: msg });
    };
    process.on('unhandledRejection', errorHandler);
    process.on('uncaughtException', errorHandler);

    try {
      const scriptErrors = await loadScripts(ctx, {
        baseUrl: url,
        token,
        deadline: scriptDeadline,
        suppressErrors: config?.suppressErrors,
      });
      errors.push(...scriptErrors);

      // Flush React's async scheduler (MessageChannel-deferred reconciliation).
      // Yields the event loop until the DOM element count stabilizes, allowing
      // React's first render pass and any immediate effects to complete.
      // For non-SPA pages, this exits immediately (DOM already stable).
      const mountSelector = config?.spa?.mountSelector ?? '#root > *';
      const flushBudget = Math.max(500, scriptDeadline - Date.now());
      await flushReactRender(ctx.document, {
        timeoutMs: flushBudget,
        stableRounds: 3,
        waitForSelector: mountSelector,
        mockFetch: ctx.mockFetch,
      });
    } catch (err: any) {
      if (err.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT' || /timed out|timeout/i.test(err.message)) {
        errors.push({ code: 'SCRIPT_TIMEOUT', message: err.message });
      } else {
        errors.push({ code: 'SCRIPT_ERROR', message: err.message });
      }
    } finally {
      // Remove error handlers — but keep them for one more event loop turn
      // to catch deferred React errors from MessageChannel callbacks that fire
      // after flushReactRender returns.
      await new Promise<void>((resolve) => setTimeout(resolve, 200));
      process.removeListener('unhandledRejection', errorHandler);
      process.removeListener('uncaughtException', errorHandler);
      // Collect any async errors that were captured during execution
      errors.push(...asyncErrors);
    }
  }

  const renderMs = performance.now() - start;

  const result: RenderResult = {
    document: ctx.document,
    meta: {
      url,
      renderMs: Math.round(renderMs * 100) / 100,
      parseMs: Math.round(parseMs * 100) / 100,
      configSource,
      ...(tokenSource ? { tokenSource } : {}),
      ...(authMeta ? { auth: authMeta } : {}),
    },
    errors,
    flush: (opts) => flushReactRender(ctx.document, {
      timeoutMs: opts?.timeoutMs ?? 3000,
      stableRounds: opts?.stableRounds ?? 3,
      waitForSelector: opts?.waitForSelector,
      mockFetch: ctx.mockFetch,
    }),
  };

  return result;
}

export async function execute(args: ParsedArgs): Promise<CommandResult> {
  if (!args.url) {
    return {
      exitCode: 1,
      errors: [{ code: 'MISSING_URL', message: 'render requires a URL' }],
    };
  }

  try {
    const result = await renderUrl(args.url, {
      token: args.token,
      timeout: args.timeout,
      noJs: args.noJs,
      configPath: args.config,
    });

    const output = formatOutput({
      url: result.meta.url,
      title: result.document.title ?? '',
      renderMs: result.meta.renderMs,
      parseMs: result.meta.parseMs,
      configSource: result.meta.configSource,
      tokenSource: result.meta.tokenSource,
      elementCount: result.document.querySelectorAll('*').length,
      errors: result.errors,
    }, args.format);

    return { exitCode: 0, output, data: result };
  } catch (err: any) {
    return {
      exitCode: 1,
      errors: [{ code: err.code ?? 'RENDER_ERROR', message: err.message }],
    };
  }
}
