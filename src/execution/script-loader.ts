import type { VmContext } from './vm-context';

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
}

export type ScriptError = { code: string; message: string };

/**
 * Detect top-level ESM syntax (import/export at line start).
 * Vite production bundles use static import/export and cannot run in
 * vm.runInContext directly — they need to be bundled to IIFE first.
 */
function hasEsmSyntax(code: string): boolean {
  return /^\s*(?:import[\s{"'*]|export[\s{*])/m.test(code);
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
): Promise<string> {
  // Dynamic import so that esbuild is not required for non-SPA pages
  const { build } = await import('esbuild');

  const fetchHeaders: Record<string, string> = {};
  if (token) fetchHeaders['Authorization'] = `Bearer ${token}`;

  const result = await build({
    stdin: {
      contents: entryCode,
      loader: 'js',
      sourcefile: entryUrl,
    },
    bundle: true,
    format: 'iife',
    platform: 'browser',
    write: false,
    logLevel: 'silent',
    // React bundles expect these globals to be present
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    plugins: [
      {
        name: 'dixie-http-fetch',
        setup(build) {
          // Intercept absolute-path imports (e.g. /assets/vendor-hash.js)
          // and full-URL imports from the same origin
          build.onResolve(
            { filter: /^(https?:\/\/|\/)/ },
            (args) => {
              const base = args.importer?.startsWith('http') ? args.importer : entryUrl;
              const resolved = new URL(args.path, base).toString();
              return { path: resolved, namespace: 'dixie-http' };
            },
          );

          // Relative imports from within our namespace (./chunk.js, ../lib.js)
          build.onResolve(
            { filter: /^\.\.?\//, namespace: 'dixie-http' },
            (args) => ({
              path: new URL(args.path, args.importer).toString(),
              namespace: 'dixie-http',
            }),
          );

          build.onLoad(
            { filter: /.*/, namespace: 'dixie-http' },
            async (args) => {
              if (Date.now() > deadline) {
                throw new Error('Script bundling timed out');
              }
              const response = await fetch(args.path, { headers: fetchHeaders });
              if (!response.ok) {
                throw new Error(`HTTP ${response.status} fetching ${args.path}`);
              }
              const contents = await response.text();
              return { contents, loader: 'js' };
            },
          );
        },
      },
    ],
  });

  return result.outputFiles?.[0]?.text ?? '';
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
): Promise<ScriptError[]> {
  const scripts = ctx.document.querySelectorAll('script');
  const baseUrl = options?.baseUrl ?? 'http://localhost/';
  const token = options?.token;
  const deadline = options?.deadline ?? Date.now() + 10_000;
  const errors: ScriptError[] = [];

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
            code = await bundleToIife(code, scriptUrl, token, deadline);
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
      if (code.trim()) {
        const result = ctx.executeScript(code);
        if (result.error) {
          errors.push({ code: 'SCRIPT_EXEC_ERROR', message: `inline script: ${result.error}` });
        }
      }
    }
  }

  return errors;
}
