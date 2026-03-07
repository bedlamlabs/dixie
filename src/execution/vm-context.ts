import * as vm from 'node:vm';
import { createDixieEnvironment } from '../environment';
import type { DixieEnvironment } from '../environment';

export interface VmContextOptions {
  timeout?: number;
  url?: string;
}

export interface ScriptResult {
  error?: string;
}

export interface VmContext {
  document: any;
  window: any;
  executeScript: (code: string) => ScriptResult;
  env: DixieEnvironment;
}

export function createVmContext(options?: VmContextOptions): VmContext {
  const env = createDixieEnvironment({ url: options?.url ?? 'http://localhost/' });
  const timeout = options?.timeout ?? 5000;

  const sandbox: Record<string, any> = {
    document: env.document,
    window: env.window,
    console: env.window.console ?? console,
    setTimeout: env.window.setTimeout?.bind(env.window) ?? globalThis.setTimeout,
    setInterval: env.window.setInterval?.bind(env.window) ?? globalThis.setInterval,
    clearTimeout: env.window.clearTimeout?.bind(env.window) ?? globalThis.clearTimeout,
    clearInterval: env.window.clearInterval?.bind(env.window) ?? globalThis.clearInterval,
  };

  // Wire window self-references
  sandbox.window = sandbox;

  const context = vm.createContext(sandbox);

  function executeScript(code: string): ScriptResult {
    try {
      vm.runInContext(code, context, { timeout });
      return {};
    } catch (err: any) {
      const msg = err.message ?? String(err);
      // Re-throw timeouts so callers can handle them
      if (err.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT' || /timed out/i.test(msg)) {
        const timeoutErr = new Error(`Script timeout after ${timeout}ms`);
        (timeoutErr as any).code = 'ERR_SCRIPT_EXECUTION_TIMEOUT';
        throw timeoutErr;
      }
      return { error: msg };
    }
  }

  return {
    document: env.document,
    window: sandbox,
    executeScript,
    env,
  };
}
