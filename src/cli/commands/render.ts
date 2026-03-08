import type { ParsedArgs, CommandResult, DixieConfig, DixieConfigV4 } from '../types';
import { createDixieEnvironment } from '../../environment';
import { createVmContext } from '../../execution/vm-context';
import { loadScripts } from '../../execution/script-loader';
import { resolveConfig } from '../config-loader';
import { formatOutput } from '../format';
import * as path from 'node:path';

export interface RenderOptions {
  token?: string;
  config?: DixieConfig | DixieConfigV4;
  timeout?: number;
  noJs?: boolean;
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
}

export async function renderUrl(url: string, options?: RenderOptions): Promise<RenderResult> {
  const start = performance.now();
  const errors: Array<{ code: string; message: string }> = [];

  // Determine config source
  let config: DixieConfig | null = options?.config ?? null;
  let configSource = 'defaults';

  if (!config && !url.startsWith('data:')) {
    try {
      config = await resolveConfig(url, process.cwd());
      if (config) configSource = 'file';
    } catch {
      configSource = 'defaults';
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
    // Check if this is a v4 AuthStrategy (has 'type' property)
    const authConfig = config.auth as any;
    if (authConfig.type && !authConfig.baseUrl) {
      // v4 AuthStrategy — use acquire() directly if available
      if (authConfig.type !== 'none' && authConfig.acquire) {
        try {
          token = await authConfig.acquire();
          tokenSource = 'config';
        } catch (err: any) {
          authMeta = { status: 'failed', reason: err.message ?? String(err) };
        }
      }
      // type === 'none' — no auth needed
    } else {
      // Legacy TokenConfig — try to acquire token from server
      try {
        const { TokenAcquisition } = await import('../../auth');
        const ta = new TokenAcquisition(authConfig);
        const result = await ta.acquire();
        if (result.userToken && result.source === 'live') {
          token = result.userToken;
          tokenSource = 'config';
        } else if (result.source === 'mock' && result.error) {
          authMeta = { status: 'failed', reason: result.error };
        }
      } catch (err: any) {
        authMeta = { status: 'failed', reason: err.message ?? String(err) };
      }
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
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(url, { headers });
      html = await response.text();
    } catch (err: any) {
      // If a config was explicitly provided (v4 mode), degrade gracefully
      // with an empty document instead of throwing
      if (options?.config) {
        html = '';
        errors.push({ code: 'FETCH_FAILED', message: `Could not reach ${url}: ${err.message}` });
      } else {
        const error = new Error(`Could not reach ${url}: ${err.message}`);
        (error as any).code = 'FETCH_FAILED';
        throw error;
      }
    }
  }

  const parseMs = performance.now() - parseStart;

  // Create environment and parse HTML
  const ctx = createVmContext({ timeout: options?.timeout ?? 5000, url });

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

  // Execute scripts unless --no-js
  if (options?.noJs) {
    // Strip script tags from the DOM when JS is disabled
    const scripts = ctx.document.querySelectorAll('script');
    for (const script of scripts) {
      script.parentNode?.removeChild(script);
    }
  } else {
    try {
      loadScripts(ctx);
    } catch (err: any) {
      if (err.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT' || /timed out|timeout/i.test(err.message)) {
        errors.push({ code: 'SCRIPT_TIMEOUT', message: err.message });
      } else {
        errors.push({ code: 'SCRIPT_ERROR', message: err.message });
      }
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
      ...(tokenSource ? { tokenSource, tokenValue } : {}),
      ...(authMeta ? { auth: authMeta } : {}),
    },
    errors,
  };

  return result;
}

export async function execute(args: ParsedArgs): Promise<CommandResult> {
  if (!args.url) {
    return {
      exitCode: 1,
      data: { command: 'render', error: 'render requires a URL' },
      errors: [{ code: 'MISSING_URL', message: 'render requires a URL' }],
    };
  }

  try {
    const result = await renderUrl(args.url, {
      token: args.token,
      timeout: args.timeout,
      noJs: args.noJs,
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
      data: { command: 'render', error: err.message },
      errors: [{ code: err.code ?? 'RENDER_ERROR', message: err.message }],
    };
  }
}
