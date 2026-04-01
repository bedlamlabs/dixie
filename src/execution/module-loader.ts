/**
 * Module loader — executes ES modules in the Dixie VM context.
 *
 * Uses Node's vm.SourceTextModule with a recursive linker that fetches
 * imported modules via LiveFetch. Module resolution follows browser
 * semantics (URL-based, not Node.js node_modules resolution).
 *
 * This is a Dixie-native feature — no external bundler or transpiler.
 * The VM's own module system handles import/export, and LiveFetch
 * handles the network. Modules are cached by resolved URL so the
 * same dependency imported by multiple modules is fetched once.
 */

import * as vm from 'node:vm';

// ── Types ─────────────────────────────────────────────────────────────

export interface ModuleLoaderOptions {
  /** Function to fetch module source by URL. */
  fetchFn: (url: string) => Promise<string>;
  /** The VM context to execute modules in. */
  vmContext: vm.Context;
  /** Base URL for resolving relative imports. */
  baseUrl: string;
  /** Timeout for module evaluation in ms. */
  timeout?: number;
}

export interface ModuleLoadResult {
  executed: boolean;
  error?: string;
}

// ── Availability check ────────────────────────────────────────────────

/**
 * Returns true if vm.SourceTextModule is available in this Node.js runtime.
 * Requires --experimental-vm-modules flag on Node < 22.
 */
export function isModuleLoaderAvailable(): boolean {
  return typeof (vm as any).SourceTextModule === 'function';
}

// ── Module loader ─────────────────────────────────────────────────────

/**
 * Execute an ES module in the Dixie VM context with full import resolution.
 *
 * @param source - The module source code
 * @param sourceUrl - The URL of this module (for resolving relative imports)
 * @param options - Loader configuration
 */
export async function executeModule(
  source: string,
  sourceUrl: string,
  options: ModuleLoaderOptions,
): Promise<ModuleLoadResult> {
  const STM = (vm as any).SourceTextModule;
  if (!STM) {
    return {
      executed: false,
      error: 'vm.SourceTextModule not available. Run Node with --experimental-vm-modules flag.',
    };
  }

  // Cache: resolved URL → linked SourceTextModule (avoids re-fetching + re-linking)
  const moduleCache = new Map<string, any>();

  // Create the linker that recursively resolves imports
  async function linker(specifier: string, referencingModule: any): Promise<any> {
    const referrerUrl = referencingModule._dixieUrl ?? sourceUrl;
    const resolvedUrl = resolveModuleSpecifier(specifier, referrerUrl);

    // Check cache
    const cached = moduleCache.get(resolvedUrl);
    if (cached) return cached;

    // Fetch the module source
    let moduleSource: string;
    try {
      moduleSource = await options.fetchFn(resolvedUrl);
    } catch (err: any) {
      // Return a synthetic empty module for unfetchable imports
      // (analytics, tracking, etc. that 404 shouldn't crash the app)
      const empty = new STM('export default undefined;', {
        context: options.vmContext,
        identifier: resolvedUrl,
      });
      empty._dixieUrl = resolvedUrl;
      moduleCache.set(resolvedUrl, empty);
      await empty.link(linker);
      return empty;
    }

    const mod = new STM(moduleSource, {
      context: options.vmContext,
      identifier: resolvedUrl,
    });
    mod._dixieUrl = resolvedUrl;
    moduleCache.set(resolvedUrl, mod);

    // Recursively link this module's imports
    await mod.link(linker);
    return mod;
  }

  try {
    const rootModule = new STM(source, {
      context: options.vmContext,
      identifier: sourceUrl,
    });
    rootModule._dixieUrl = sourceUrl;
    moduleCache.set(sourceUrl, rootModule);

    await rootModule.link(linker);
    await rootModule.evaluate({ timeout: options.timeout ?? 10000 });

    return { executed: true };
  } catch (err: any) {
    return {
      executed: false,
      error: err.message ?? String(err),
    };
  }
}

// ── URL resolution ────────────────────────────────────────────────────

/**
 * Resolve a module specifier against a referrer URL.
 * Follows browser module resolution semantics:
 * - Absolute URLs pass through
 * - Relative paths (./ or ../) resolve against the referrer
 * - Bare specifiers (no ./ prefix) are treated as absolute paths from origin
 */
function resolveModuleSpecifier(specifier: string, referrerUrl: string): string {
  // Absolute URL — pass through
  if (specifier.startsWith('http://') || specifier.startsWith('https://') || specifier.startsWith('data:')) {
    return specifier;
  }

  // Relative path — resolve against referrer
  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    try {
      return new URL(specifier, referrerUrl).href;
    } catch {
      return specifier;
    }
  }

  // Bare specifier starting with / — resolve against origin
  if (specifier.startsWith('/')) {
    try {
      const origin = new URL(referrerUrl).origin;
      return origin + specifier;
    } catch {
      return specifier;
    }
  }

  // Bare specifier (e.g., "react", "lodash") — resolve against origin
  // In browser module resolution, bare specifiers need an import map.
  // Without one, we resolve against the origin as a path.
  try {
    const origin = new URL(referrerUrl).origin;
    return origin + '/' + specifier;
  } catch {
    return specifier;
  }
}
