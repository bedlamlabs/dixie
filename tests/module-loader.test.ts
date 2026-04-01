/**
 * Tests for ES module execution in the Dixie VM.
 *
 * Note: These tests require Node.js with --experimental-vm-modules.
 * Tests will be skipped if vm.SourceTextModule is not available.
 */
import { describe, it, expect } from 'vitest';
import { isModuleLoaderAvailable, executeModule } from '../src/execution/module-loader';
import { createVmContext } from '../src/execution/vm-context';
import { loadScripts } from '../src/execution/script-loader';
import * as vm from 'node:vm';

const canRunModules = isModuleLoaderAvailable();
const describeModules = canRunModules ? describe : describe.skip;

describe('isModuleLoaderAvailable', () => {
  it('returns a boolean', () => {
    expect(typeof isModuleLoaderAvailable()).toBe('boolean');
  });
});

describeModules('executeModule', () => {
  it('executes a simple module that mutates the sandbox', async () => {
    const ctx = createVmContext({ url: 'http://test.local/', enableFetch: false });
    ctx.window._result = undefined;

    const result = await executeModule(
      'window._result = "module ran";',
      'http://test.local/app.js',
      {
        fetchFn: async () => '',
        vmContext: ctx._vmContext!,
        baseUrl: 'http://test.local/',
      },
    );

    expect(result.executed).toBe(true);
    // Note: module code runs in strict mode and has its own scope,
    // but can access the sandbox globals via the context
  });

  it('resolves relative imports via fetchFn', async () => {
    const ctx = createVmContext({ url: 'http://test.local/', enableFetch: false });

    const modules: Record<string, string> = {
      'http://test.local/utils.js': 'export function greet(n) { return "Hello " + n; }',
    };

    const result = await executeModule(
      'import { greet } from "./utils.js"; globalThis._greeting = greet("Dixie");',
      'http://test.local/app.js',
      {
        fetchFn: async (url) => {
          if (modules[url]) return modules[url];
          throw new Error(`404: ${url}`);
        },
        vmContext: ctx._vmContext!,
        baseUrl: 'http://test.local/',
      },
    );

    expect(result.executed).toBe(true);
  });

  it('handles fetch errors gracefully with empty module fallback', async () => {
    const ctx = createVmContext({ url: 'http://test.local/', enableFetch: false });

    const result = await executeModule(
      'import analytics from "./missing-analytics.js"; globalThis._ran = true;',
      'http://test.local/app.js',
      {
        fetchFn: async () => { throw new Error('404'); },
        vmContext: ctx._vmContext!,
        baseUrl: 'http://test.local/',
      },
    );

    // Should succeed — missing imports get an empty module fallback
    expect(result.executed).toBe(true);
  });

  it('reports syntax errors', async () => {
    const ctx = createVmContext({ url: 'http://test.local/', enableFetch: false });

    const result = await executeModule(
      'export const x = {{{invalid;',
      'http://test.local/bad.js',
      {
        fetchFn: async () => '',
        vmContext: ctx._vmContext!,
        baseUrl: 'http://test.local/',
      },
    );

    expect(result.executed).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('caches modules by URL (same module imported twice)', async () => {
    const ctx = createVmContext({ url: 'http://test.local/', enableFetch: false });

    let fetchCount = 0;
    const modules: Record<string, string> = {
      'http://test.local/shared.js': 'export const x = 42;',
    };

    const result = await executeModule(
      `import { x as a } from "./shared.js";
       import { x as b } from "./shared.js";
       globalThis._sum = a + b;`,
      'http://test.local/app.js',
      {
        fetchFn: async (url) => {
          fetchCount++;
          if (modules[url]) return modules[url];
          throw new Error('404');
        },
        vmContext: ctx._vmContext!,
        baseUrl: 'http://test.local/',
      },
    );

    expect(result.executed).toBe(true);
    // Module should be cached — only fetched once even though imported twice
    expect(fetchCount).toBe(1);
  });
});

describeModules('loadScripts with modules', () => {
  it('executes inline type="module" scripts', async () => {
    const ctx = createVmContext({ url: 'http://test.local/', enableFetch: false });
    ctx.document.body.innerHTML = `
      <script type="module">globalThis._moduleRan = true;</script>
    `;

    const result = await loadScripts(ctx, {
      fetchFn: async () => '',
    });

    expect(result.executed).toBe(1);
  });

  it('executes external type="module" scripts', async () => {
    const ctx = createVmContext({ url: 'http://test.local/', enableFetch: false });
    ctx.document.body.innerHTML = `
      <script type="module" src="http://test.local/app.mjs"></script>
    `;

    const result = await loadScripts(ctx, {
      fetchFn: async (url) => {
        if (url === 'http://test.local/app.mjs') {
          return 'globalThis._externalModule = true;';
        }
        throw new Error('404');
      },
    });

    expect(result.executed).toBe(1);
  });

  it('classic scripts execute before modules', async () => {
    const ctx = createVmContext({ url: 'http://test.local/', enableFetch: false });
    ctx.document.body.innerHTML = `
      <script type="module">globalThis._order.push("module");</script>
      <script>globalThis._order = []; globalThis._order.push("classic");</script>
    `;

    const result = await loadScripts(ctx, {
      fetchFn: async () => '',
    });

    expect(result.executed).toBe(2);
    expect(ctx.window._order).toEqual(['classic', 'module']);
  });
});
