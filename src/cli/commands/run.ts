import * as path from 'node:path';
import type { ParsedArgs, CommandResult } from '../types';
import { formatOutput } from '../format';

export interface RunResult {
  passed: boolean;
  durationMs: number;
  error?: string;
  output?: any;
}

export async function runTestFile(filePath: string): Promise<RunResult> {
  const start = performance.now();
  const abs = path.resolve(filePath);

  try {
    // Use esbuild to transpile TypeScript test files
    if (abs.endsWith('.ts') || abs.endsWith('.tsx')) {
      const esbuild = await import('esbuild');
      const fs = await import('node:fs');
      const source = fs.readFileSync(abs, 'utf-8');

      const result = await esbuild.transform(source, {
        loader: abs.endsWith('.tsx') ? 'tsx' : 'ts',
        format: 'esm',
        target: 'node18',
      });

      const tmpFile = abs.replace(/\.tsx?$/, '.dixie-tmp.mjs');
      fs.writeFileSync(tmpFile, result.code);

      try {
        const mod = await import(`file://${tmpFile}`);
        const testFn = mod.default;
        if (typeof testFn === 'function') {
          const output = await testFn();
          const durationMs = performance.now() - start;
          return {
            passed: output?.passed !== false,
            durationMs: Math.round(durationMs * 100) / 100,
            output,
          };
        }
        return {
          passed: true,
          durationMs: Math.round((performance.now() - start) * 100) / 100,
        };
      } finally {
        fs.unlinkSync(tmpFile);
      }
    }

    // For .js/.mjs, import directly
    const mod = await import(`file://${abs}`);
    const testFn = mod.default;
    if (typeof testFn === 'function') {
      const output = await testFn();
      const durationMs = performance.now() - start;
      return {
        passed: output?.passed !== false,
        durationMs: Math.round(durationMs * 100) / 100,
        output,
      };
    }

    return {
      passed: true,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    };
  } catch (err: any) {
    const durationMs = performance.now() - start;
    const isSyntax = /syntax/i.test(err.message) || /unexpected/i.test(err.message) || /parse/i.test(err.message) || /transform failed/i.test(err.message) || /expected/i.test(err.message);
    return {
      passed: false,
      durationMs: Math.round(durationMs * 100) / 100,
      error: isSyntax ? `Syntax error: ${err.message}` : err.message,
    };
  }
}

export async function execute(args: ParsedArgs): Promise<CommandResult> {
  const filePath = args.file ?? args.url;
  if (!filePath) {
    return {
      exitCode: 1,
      errors: [{ code: 'MISSING_FILE', message: 'run requires a file path' }],
    };
  }

  const result = await runTestFile(filePath);
  const output = formatOutput(result, args.format ?? 'json');
  return {
    exitCode: result.passed ? 0 : 1,
    output,
    data: result,
  };
}
