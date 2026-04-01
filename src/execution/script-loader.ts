/**
 * Script loader — fetches and executes <script> tags in document order.
 *
 * Handles inline scripts, external scripts, and ES modules with correct
 * async/defer ordering semantics. External scripts are fetched in parallel
 * and executed in document order for maximum speed.
 *
 * ES modules are executed via Node's vm.SourceTextModule with a recursive
 * linker that resolves imports by fetching them through LiveFetch.
 *
 * Speed architecture:
 * - Zero overhead for pages with no external scripts (sync fast path)
 * - All external scripts fetched concurrently via Promise.allSettled()
 * - Per-script AbortController timeout — one hanging CDN doesn't block the rest
 * - Promise-level cache on LiveFetch deduplicates same-URL scripts
 * - Module cache prevents re-fetching/re-linking shared dependencies
 */

import type { VmContext } from './vm-context';
import { isModuleLoaderAvailable, executeModule } from './module-loader';

// ── Types ─────────────────────────────────────────────────────────────

export interface ScriptLoadOptions {
  /** Function to fetch script text by URL. Defaults to liveFetch.fetchText if available. */
  fetchFn?: (url: string) => Promise<string>;
  /** Timeout per external script fetch in ms. Default: 10000. */
  scriptTimeout?: number;
  /** Callback for individual script errors (non-fatal). */
  onScriptError?: (src: string, error: Error) => void;
}

export interface ScriptLoadResult {
  executed: number;
  failed: number;
  skipped: number;
  errors: Array<{ src: string; error: string }>;
}

// ── Constants ─────────────────────────────────────────────────────────

const EXECUTABLE_TYPES = new Set([
  '',           // no type attribute = JavaScript
  'text/javascript',
  'application/javascript',
  'module',     // ES module — bundled to IIFE via esbuild before execution
]);

export interface ScriptLoaderOptions {
  /** Page URL — used to resolve relative src paths */
  baseUrl?: string;
  /** Bearer token forwarded to all script fetches */
  token?: string;
  /**
   * Hard deadline as ms since epoch. All fetches and bundling operations
   * stop when exceeded. Defaults to 10s from now.
   */
  deadline?: number;
  /** Error messages to suppress in the bundled IIFE (from DixieConfig.suppressErrors). */
  suppressErrors?: string[];
}

export type ScriptError = { code: string; message: string };

export interface DevServerAdapter {
  matches(src: string): boolean;
  transformSource(code: string): string;
  skipPatterns(): RegExp[];
  bannerCode(): string;
  transformBundle(code: string): string;
  name(): string;
}

export class ViteDevServerAdapter implements DevServerAdapter {
  name(): string {
    return 'Vite';
  }

  matches(src: string): boolean {
    return /^\/@vite\//.test(src) || /^\/@react-refresh/.test(src);
  }

  transformSource(code: string): string {
    // Replace import.meta.hot with a banner-defined stub variable.
    // This handles ALL patterns: assignments, method calls, and conditionals.
    code = code.replace(/import\.meta\.hot/g, '__vite_import_meta_hot__');
    // Replace import.meta.env with the banner-defined env object
    code = code.replace(/import\.meta\.env/g, '__vite_import_meta_env__');
    // Replace import.meta.url with a placeholder string
    code = code.replace(/import\.meta\.url/g, '"about:blank"');
    // Catch any remaining import.meta references
    code = code.replace(/import\.meta/g, '({})');
    return code;
  }

  skipPatterns(): RegExp[] {
    return [
      /^\/@vite\//,         // /@vite/client — HMR WebSocket client
      /^\/@react-refresh/,  // React Fast Refresh runtime
    ];
  }

  bannerCode(): string {
    return `var __vite_import_meta_hot__ = {accept(){},dispose(){},prune(){},invalidate(){},on(){},off(){},data:{}};
var __vite_import_meta_env__ = {DEV:false,PROD:true,MODE:"production",BASE_URL:"/",SSR:false};`;
  }

  transformBundle(code: string): string {
    // Neutralize Vite dev server preamble check in the bundled output.
    // The Vite React plugin wraps every component with a check for
    // __vite_plugin_react_preamble_installed__. Replace the throw with void 0.
    return code.replace(
      /throw\s+new\s+Error\(\s*["']@vitejs\/plugin-react can't detect preamble\.[^"']*["']\s*\)/g,
      'void 0',
    );
  }
}

export function detectDevServer(html: string): DevServerAdapter | null {
  // Check if HTML contains Vite dev server markers
  if (
    html.includes('/@vite/') ||
    html.includes('/@react-refresh') ||
    html.includes('__vite_plugin_react_preamble_installed__')
  ) {
    return new ViteDevServerAdapter();
  }
  return null;
}

/**
 * Detect top-level ESM syntax (import/export at line start).
 * Vite production bundles use static import/export and cannot run in
 * vm.runInContext directly — they need to be bundled to IIFE first.
 */
function hasEsmSyntax(code: string): boolean {
  return /^\s*(?:import[\s{"'*]|export[\s{*])/m.test(code);
}

/**
 * Vite dev server scripts that should be skipped during rendering.
 * These are HMR/Fast-Refresh infrastructure — not needed for testing.
 */
const VITE_DEV_SKIP_PATTERNS = [
  /^\/@vite\//,         // /@vite/client — HMR WebSocket client
  /^\/@react-refresh/,  // React Fast Refresh runtime
];

function isViteDevScript(src: string): boolean {
  return VITE_DEV_SKIP_PATTERNS.some(p => p.test(src));
}

function isViteDevInlineScript(code: string): boolean {
  return code.includes('/@react-refresh') || code.includes('__vite_plugin_react_preamble_installed__');
}

/**
 * Strip Vite dev server HMR wrapper code from a module's source.
 * Every file served by Vite dev gets import.meta.hot injections at the top
 * and HMR accept/refresh calls at the bottom. These reference import.meta
 * which doesn't work in IIFE format. Strip them before esbuild bundles.
 */
function stripViteHmr(code: string): string {
  // Replace import.meta.hot with a banner-defined stub variable.
  // This handles ALL patterns: assignments, method calls, and conditionals.
  code = code.replace(/import\.meta\.hot/g, '__vite_import_meta_hot__');
  // Replace import.meta.env with the banner-defined env object
  code = code.replace(/import\.meta\.env/g, '__vite_import_meta_env__');
  // Replace import.meta.url with a placeholder string
  code = code.replace(/import\.meta\.url/g, '"about:blank"');
  // Catch any remaining import.meta references
  code = code.replace(/import\.meta/g, '({})');
  return code;
}

/**
 * Bundle ESM code + all its imported chunks into a single IIFE string,
 * fetching each imported module from the server using the same auth token.
 *
 * This handles the Vite production pattern where the entry script imports
 * vendor and route chunks via static ES import statements.
 */
async function bundleToIife(
  entryCode: string,
  entryUrl: string,
  token: string | undefined,
  deadline: number,
  suppressErrors?: string[],
  adapter?: DevServerAdapter | null,
): Promise<string> {
  // Dynamic import so that esbuild is not required for non-SPA pages
  const { build } = await import('esbuild');

  const fetchHeaders: Record<string, string> = {};
  if (token) fetchHeaders['Authorization'] = `Bearer ${token}`;

  // Bypass Vite's modulepreload function. Since esbuild inlines ALL chunks
  // (0 remaining import() calls), the preload is unnecessary. The preload
  // function creates <link> elements and waits for load events that never
  // fire in the VM, potentially blocking lazy route resolution.
  // Replace it with a simple pass-through that calls the import function directly.
  const bypassedEntry = entryCode.replace(
    /,Ii=function\(e,t,n\)\{/,
    ',Ii=function(e,t,n){return e();};var __dixie_unused=function(e,t,n){',
  );

  // Use entryPoints with a virtual entry module instead of stdin, so ALL
  // modules (including the entry) live in the same 'dixie-http' namespace.
  // This prevents esbuild from duplicating modules when chunks import back
  // to the entry file — stdin vs dixie-http would be different namespaces,
  // causing double createContext() and breaking React auth context.
  const finalEntry = bypassedEntry !== entryCode ? bypassedEntry : entryCode;

  const bannerJs = adapter
    ? adapter.bannerCode()
    : `var __vite_import_meta_hot__ = {accept(){},dispose(){},prune(){},invalidate(){},on(){},off(){},data:{}};
var __vite_import_meta_env__ = {DEV:false,PROD:true,MODE:"production",BASE_URL:"/",SSR:false};`;

  const result = await build({
    entryPoints: [entryUrl],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    write: false,
    logLevel: 'silent',
    // React bundles expect these globals to be present
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    // Inject a no-op import.meta.hot stub and import.meta.env at the top of the IIFE.
    // Vite dev server injects import.meta.hot = createHotContext(...) and
    // import.meta.hot.accept(...) into every file. In IIFE format, esbuild replaces
    // import.meta with an object, but the HMR calls still execute. The banner
    // provides a safe stub so these calls are no-ops instead of runtime errors.
    banner: {
      js: bannerJs,
    },
    plugins: [
      {
        name: 'dixie-http-fetch',
        setup(build) {
          // Resolve Vite dev virtual paths to empty modules (not needed for rendering)
          build.onResolve(
            { filter: /^\/@react-refresh|^\/@vite\// },
            () => ({ path: 'vite-dev-noop', namespace: 'dixie-noop' }),
          );

          // Resolve ALL imports to the dixie-http namespace
          build.onResolve(
            { filter: /^(https?:\/\/|\/)/ },
            (args) => {
              const base = args.importer?.startsWith('http') ? args.importer : entryUrl;
              // Vite virtual paths like /@fs/... and /@id/... resolve against the server
              const resolved = new URL(args.path, base).toString();
              return { path: resolved, namespace: 'dixie-http' };
            },
          );

          // Relative imports — also to dixie-http namespace.
          // Catches dynamic import("./chunk.js") too — esbuild inlines them
          // as Promise.resolve().then() patterns in IIFE format.
          build.onResolve(
            { filter: /^\.\.?\// },
            (args) => ({
              path: new URL(args.path, args.importer || entryUrl).toString(),
              namespace: 'dixie-http',
            }),
          );

          // Resolve the entry point itself to dixie-http namespace
          build.onResolve(
            { filter: /.*/ },
            (args) => {
              if (args.kind === 'entry-point') {
                return { path: entryUrl, namespace: 'dixie-http' };
              }
              return undefined; // let other resolvers handle
            },
          );

          // Return stub modules for Vite dev infrastructure imports.
          // Every Vite-served file imports createHotContext from /@vite/client
          // and RefreshRuntime from /@react-refresh. Provide no-op stubs so
          // esbuild can bundle without errors.
          build.onLoad(
            { filter: /.*/, namespace: 'dixie-noop' },
            () => ({
              contents: `
                // /@vite/client stubs
                export function createHotContext() { return { accept(){}, dispose(){}, prune(){}, invalidate(){}, on(){}, off(){}, data:{} }; }
                export function updateStyle() {}
                export function removeStyle() {}
                // /@react-refresh stubs
                export function injectIntoGlobalHook() {}
                export function createSignatureFunctionForTransform() { return function(type) { return type; }; }
                export function isLikelyComponentType() { return false; }
                export function getFamilyByType() { return undefined; }
                export function register() {}
                export function getRefreshReg() { return function() {}; }
                export function __hmr_import() { return Promise.resolve({}); }
                export function registerExportsForReactRefresh() {}
                export function validateRefreshBoundaryAndEnqueueUpdate() { return undefined; }
                export default {};
              `,
              loader: 'js',
            }),
          );

          build.onLoad(
            { filter: /.*/, namespace: 'dixie-http' },
            async (args) => {
              // Return cached entry content for the entry URL
              if (args.path === entryUrl) {
                return { contents: adapter ? adapter.transformSource(finalEntry) : stripViteHmr(finalEntry), loader: 'js' };
              }
              if (Date.now() > deadline) {
                throw new Error('Script bundling timed out');
              }
              const response = await fetch(args.path, { headers: fetchHeaders });
              if (!response.ok) {
                throw new Error(`HTTP ${response.status} fetching ${args.path}`);
              }
              let contents = await response.text();
              // Strip Vite dev server HMR wrappers from each module
              contents = adapter ? adapter.transformSource(contents) : stripViteHmr(contents);
              return { contents, loader: 'js' };
            },
          );
        },
      },
    ],
  });

  let code = result.outputFiles?.[0]?.text ?? '';

  // Apply adapter-specific bundle transformations (e.g. Vite preamble neutralization)
  if (adapter) {
    code = adapter.transformBundle(code);
  } else {
    // Neutralize Vite dev server preamble check in the bundled output.
    // The Vite React plugin wraps every component with a check for
    // __vite_plugin_react_preamble_installed__. Replace the throw with void 0.
    code = code.replace(
      /throw\s+new\s+Error\(\s*["']@vitejs\/plugin-react can't detect preamble\.[^"']*["']\s*\)/g,
      'void 0',
    );
  }

  // Suppress specific throw statements from the IIFE. Config-driven: each
  // pattern in suppressErrors matches a throw new Error("...") message and
  // replaces it with a safe default return. This prevents components without
  // error boundaries from crashing React's entire tree during re-renders.
  if (suppressErrors?.length) {
    for (const pattern of suppressErrors) {
      const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      code = code.replace(
        new RegExp(`throw new Error\\("${escaped}"\\)`, 'g'),
        'return{}',
      );
    }
  }

  return code;
}

// ── Script Classification (v5 architecture) ─────────────────────────

const enum ScriptKind {
  INLINE,
  EXTERNAL_SYNC,
  EXTERNAL_DEFER,
  EXTERNAL_ASYNC,
  MODULE_EXTERNAL,
  MODULE_INLINE,
  SKIP,
}

interface ClassifiedScript {
  kind: ScriptKind;
  element: any;
  src?: string;
  code?: string;
}

/**
 * Load and execute all <script> tags in the document.
 *
 * - Inline scripts are executed as before.
 * - External scripts (src="...") are fetched with the auth token forwarded.
 * - ESM scripts (type="module" or containing import/export) are bundled to
 *   a self-contained IIFE via esbuild before execution — this handles the
 *   Vite production pattern where the entry point imports many chunk files.
 * - Errors are collected and returned; they do NOT crash the render.
 * - The --no-js path is handled in render.ts before this function is called.
 */
export async function loadScripts(
  ctx: VmContext,
  options?: ScriptLoaderOptions,
  adapter?: DevServerAdapter | null,
): Promise<ScriptError[]> {
  const scripts = ctx.document.querySelectorAll('script');
  const baseUrl = options?.baseUrl ?? 'http://localhost/';
  const token = options?.token;
  const deadline = options?.deadline ?? Date.now() + 10_000;
  const errors: ScriptError[] = [];

  // Pre-set Vite dev server globals. When running against a Vite dev server:
  // 1. __vite_plugin_react_preamble_installed__ — React plugin preamble check
  // 2. $RefreshReg$ / $RefreshSig$ — React Fast Refresh registration (no-ops)
  ctx.executeScript(`try {
    window.__vite_plugin_react_preamble_installed__ = true;
    window.$RefreshReg$ = function() {};
    window.$RefreshSig$ = function() { return function(type) { return type; }; };
  } catch(e) {}`);

  for (const script of scripts) {
    if (Date.now() > deadline) {
      errors.push({ code: 'SCRIPT_TIMEOUT', message: 'Script loading deadline exceeded' });
      break;
    }

    const type = (script.getAttribute('type') ?? '').toLowerCase().trim();

    // Skip non-JS scripts (application/json, application/ld+json, etc.)
    if (type && !EXECUTABLE_TYPES.has(type)) {
      continue;
    }

    const src = script.getAttribute('src');
    if (src) {
      // ── Skip Vite dev server infrastructure scripts ─────────────────
      if (adapter ? adapter.skipPatterns().some(p => p.test(src)) : isViteDevScript(src)) {
        continue;
      }

      // ── External script — fetch, optionally bundle, then execute ────
      try {
        const scriptUrl = new URL(src, baseUrl).toString();
        const fetchHeaders: Record<string, string> = {};
        if (token) fetchHeaders['Authorization'] = `Bearer ${token}`;

        const remaining = deadline - Date.now();
        const controller = new AbortController();
        const fetchTimer = setTimeout(() => controller.abort(), Math.min(remaining, 15_000));

        let code: string;
        try {
          const response = await fetch(scriptUrl, {
            headers: fetchHeaders,
            signal: controller.signal,
          });
          if (!response.ok) {
            errors.push({
              code: 'SCRIPT_HTTP_ERROR',
              message: `Script ${src} returned HTTP ${response.status}`,
            });
            continue;
          }
          code = await response.text();
        } finally {
          clearTimeout(fetchTimer);
        }

        // Vite production bundles use ESM — bundle to IIFE so vm can run them
        const isModule = type === 'module' || hasEsmSyntax(code);
        if (isModule) {
          try {
            code = await bundleToIife(code, scriptUrl, token, deadline, options?.suppressErrors, adapter);
          } catch (bundleErr: any) {
            errors.push({
              code: 'SCRIPT_BUNDLE_ERROR',
              message: `Failed to bundle ${src}: ${bundleErr.message}`,
            });
            continue;
          }
        }

        if (code.trim()) {
          const result = ctx.executeScript(code);
          if (result.error) {
            errors.push({ code: 'SCRIPT_EXEC_ERROR', message: `${src}: ${result.error}` });
          }
        }
      } catch (err: any) {
        const code = err.name === 'AbortError' ? 'SCRIPT_FETCH_TIMEOUT' : 'SCRIPT_FETCH_ERROR';
        errors.push({ code, message: `Failed to load script ${src}: ${err.message}` });
      }
    } else {
      // ── Inline script ───────────────────────────────────────────────
      const code = script.textContent ?? '';
      if (!code.trim()) continue;

      // Skip Vite dev server inline scripts (React Fast Refresh preamble, etc.)
      const isViteInline = adapter
        ? (code.includes('/@react-refresh') || code.includes('__vite_plugin_react_preamble_installed__'))
        : isViteDevInlineScript(code);
      if (isViteInline) {
        continue;
      }

      // Inline ESM needs bundling too (Vite dev serves inline type="module" scripts)
      const isModule = type === 'module' || hasEsmSyntax(code);
      if (isModule) {
        try {
          // Create a virtual URL for the inline script so esbuild can resolve relative imports
          const virtualUrl = new URL('/__dixie_inline_module__.js', baseUrl).toString();
          const bundled = await bundleToIife(code, virtualUrl, token, deadline, options?.suppressErrors, adapter);
          if (bundled.trim()) {
            const result = ctx.executeScript(bundled);
            if (result.error) {
              errors.push({ code: 'SCRIPT_EXEC_ERROR', message: `inline script: ${result.error}` });
            }
          }
        } catch (bundleErr: any) {
          errors.push({
            code: 'SCRIPT_BUNDLE_ERROR',
            message: `Failed to bundle inline script: ${bundleErr.message}`,
          });
        }
      } else {
        const result = ctx.executeScript(code);
        if (result.error) {
          errors.push({ code: 'SCRIPT_EXEC_ERROR', message: `inline script: ${result.error}` });
        }
      }
    }
  }

  return errors;
}

// ── v5 Script Loader (classify-then-execute architecture) ───────────
// Alternative loading strategy with proper async/defer ordering,
// native ES module support via vm.SourceTextModule, and parallel fetch.

/**
 * Classify and execute scripts with proper async/defer/module ordering.
 * Uses the v5 classify-then-execute architecture with native ES module support.
 */
export async function loadScriptsV5(
  ctx: VmContext,
  options?: ScriptLoadOptions,
): Promise<ScriptLoadResult> {
  const scripts = ctx.document.querySelectorAll('script');
  if (scripts.length === 0) {
    return { executed: 0, failed: 0, skipped: 0, errors: [] };
  }

  // Phase 1: Scan & Classify
  const classified: ClassifiedScript[] = [];
  let hasExternal = false;
  let hasModules = false;

  for (const script of scripts) {
    const type = (script.getAttribute('type') ?? '').toLowerCase().trim();

    // Skip non-JS scripts (application/json, application/ld+json, etc.)
    if (type && !EXECUTABLE_TYPES.has(type)) {
      classified.push({ kind: ScriptKind.SKIP, element: script });
      continue;
    }

    const src = script.getAttribute('src');
    const isModule = type === 'module';

    if (!src) {
      // Inline script
      const code = script.textContent ?? '';
      if (code.trim()) {
        if (isModule) {
          classified.push({ kind: ScriptKind.MODULE_INLINE, element: script, code });
          hasModules = true;
        } else {
          classified.push({ kind: ScriptKind.INLINE, element: script, code });
        }
      } else {
        classified.push({ kind: ScriptKind.SKIP, element: script });
      }
      continue;
    }

    // External script
    hasExternal = true;

    if (isModule) {
      classified.push({ kind: ScriptKind.MODULE_EXTERNAL, element: script, src });
      hasModules = true;
      continue;
    }

    const isAsync = script.hasAttribute('async');
    const isDefer = script.hasAttribute('defer');

    if (isAsync) {
      classified.push({ kind: ScriptKind.EXTERNAL_ASYNC, element: script, src });
    } else if (isDefer) {
      classified.push({ kind: ScriptKind.EXTERNAL_DEFER, element: script, src });
    } else {
      classified.push({ kind: ScriptKind.EXTERNAL_SYNC, element: script, src });
    }
  }

  // Fast path: no external scripts and no modules — execute inline only, synchronously
  if (!hasExternal && !hasModules) {
    return executeInlineOnly(ctx, classified);
  }

  // Resolve fetch function
  const fetchFn = options?.fetchFn
    ?? (ctx.liveFetch ? (url: string) => ctx.liveFetch!.fetchText(url, { timeout: options?.scriptTimeout ?? 10000 }) : undefined);

  if (!fetchFn) {
    // No fetch capability — execute inline scripts only, skip external
    return executeInlineOnly(ctx, classified);
  }

  // Check if module execution is available
  const canRunModules = hasModules && isModuleLoaderAvailable();

  // Phase 2: Parallel Fetch of all external script URLs (including modules)
  const scriptTimeout = options?.scriptTimeout ?? 10000;
  const externalUrls = new Set<string>();
  const pageUrl = ctx.env.window.location?.href ?? 'http://localhost/';

  for (const c of classified) {
    if (c.src && (c.kind === ScriptKind.EXTERNAL_SYNC || c.kind === ScriptKind.EXTERNAL_DEFER
      || c.kind === ScriptKind.EXTERNAL_ASYNC || c.kind === ScriptKind.MODULE_EXTERNAL)) {
      // Resolve relative URLs
      try {
        const resolved = new URL(c.src, pageUrl).href;
        c.src = resolved;
        externalUrls.add(resolved);
      } catch {
        externalUrls.add(c.src);
      }
    }
  }

  const fetchResults = new Map<string, string>();
  const fetchErrors = new Map<string, string>();

  const fetchPromises = [...externalUrls].map(async (url) => {
    try {
      const text = await fetchFn(url);
      fetchResults.set(url, text);
    } catch (err: any) {
      const msg = err.name === 'AbortError' ? `Timeout after ${scriptTimeout}ms` : (err.message ?? String(err));
      fetchErrors.set(url, msg);
      options?.onScriptError?.(url, err);
    }
  });

  await Promise.allSettled(fetchPromises);

  // Phase 3: Execute in document order
  const result: ScriptLoadResult = { executed: 0, failed: 0, skipped: 0, errors: [] };
  const deferred: ClassifiedScript[] = [];
  // Modules execute after all classic scripts (per HTML spec)
  const modules: ClassifiedScript[] = [];

  for (const c of classified) {
    switch (c.kind) {
      case ScriptKind.SKIP:
        result.skipped++;
        break;

      case ScriptKind.INLINE: {
        const scriptResult = ctx.executeScript(c.code!);
        if (scriptResult.error) {
          result.failed++;
          result.errors.push({ src: 'inline', error: scriptResult.error });
        } else {
          result.executed++;
        }
        break;
      }

      case ScriptKind.EXTERNAL_SYNC:
      case ScriptKind.EXTERNAL_ASYNC: {
        const code = fetchResults.get(c.src!);
        if (code !== undefined) {
          const scriptResult = ctx.executeScript(code);
          if (scriptResult.error) {
            result.failed++;
            result.errors.push({ src: c.src!, error: scriptResult.error });
          } else {
            result.executed++;
          }
        } else {
          const fetchErr = fetchErrors.get(c.src!) ?? 'Unknown fetch error';
          result.failed++;
          result.errors.push({ src: c.src!, error: `Failed to fetch: ${fetchErr}` });
        }
        break;
      }

      case ScriptKind.EXTERNAL_DEFER:
        deferred.push(c);
        break;

      case ScriptKind.MODULE_EXTERNAL:
      case ScriptKind.MODULE_INLINE:
        modules.push(c);
        break;
    }
  }

  // Execute deferred scripts in document order (after all sync scripts)
  for (const c of deferred) {
    const code = fetchResults.get(c.src!);
    if (code !== undefined) {
      const scriptResult = ctx.executeScript(code);
      if (scriptResult.error) {
        result.failed++;
        result.errors.push({ src: c.src!, error: scriptResult.error });
      } else {
        result.executed++;
      }
    } else {
      const fetchErr = fetchErrors.get(c.src!) ?? 'Unknown fetch error';
      result.failed++;
      result.errors.push({ src: c.src!, error: `Failed to fetch: ${fetchErr}` });
    }
  }

  // Execute modules (after all classic and deferred scripts, per HTML spec)
  for (const c of modules) {
    if (!canRunModules) {
      result.skipped++;
      const src = c.src ?? 'inline module';
      result.errors.push({
        src,
        error: 'ES modules require Node.js with --experimental-vm-modules flag',
      });
      continue;
    }

    const src = c.src ?? `inline-module-${result.executed}`;
    let code: string | undefined;

    if (c.kind === ScriptKind.MODULE_INLINE) {
      code = c.code;
    } else {
      code = fetchResults.get(c.src!);
      if (code === undefined) {
        const fetchErr = fetchErrors.get(c.src!) ?? 'Unknown fetch error';
        result.failed++;
        result.errors.push({ src, error: `Failed to fetch module: ${fetchErr}` });
        continue;
      }
    }

    const modResult = await executeModule(code!, src, {
      fetchFn,
      vmContext: ctx._vmContext!,
      baseUrl: pageUrl,
      timeout: scriptTimeout,
    });

    if (modResult.executed) {
      result.executed++;
    } else {
      result.failed++;
      result.errors.push({ src, error: modResult.error ?? 'Module execution failed' });
    }
  }

  return result;
}

// ── Fast path: inline-only execution (no async, no promises) ──────────

function executeInlineOnly(ctx: VmContext, classified: ClassifiedScript[]): ScriptLoadResult {
  const result: ScriptLoadResult = { executed: 0, failed: 0, skipped: 0, errors: [] };

  for (const c of classified) {
    if (c.kind === ScriptKind.INLINE) {
      const scriptResult = ctx.executeScript(c.code!);
      if (scriptResult.error) {
        result.failed++;
        result.errors.push({ src: 'inline', error: scriptResult.error });
      } else {
        result.executed++;
      }
    } else {
      result.skipped++;
    }
  }

  return result;
}
