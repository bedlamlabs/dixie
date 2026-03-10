import type { ParsedArgs, CommandResult } from '../types';
import { createDixieEnvironment } from '../../environment';
import { formatOutput } from '../format';

export interface BenchmarkResult {
  timing: { median: number; mean: number; p95: number; min: number; max: number };
  elementCount: number;
}

function computeStats(values: number[]) {
  if (values.length === 0) return { median: 0, mean: 0, p95: 0, min: 0, max: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const mean = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
  const p95Index = Math.min(Math.ceil(sorted.length * 0.95) - 1, sorted.length - 1);
  return { median, mean, p95: sorted[p95Index], min: sorted[0], max: sorted[sorted.length - 1] };
}

export async function runBenchmark(options: { html: string; iterations: number }): Promise<BenchmarkResult> {
  const timings: number[] = [];
  let elementCount = 0;

  // Warmup
  const env0 = createDixieEnvironment({ url: 'http://bench/' });
  env0.document.body.innerHTML = options.html;

  for (let i = 0; i < options.iterations; i++) {
    const start = performance.now();
    const env = createDixieEnvironment({ url: 'http://bench/' });
    env.document.body.innerHTML = options.html;
    const ms = performance.now() - start;
    timings.push(ms);
    elementCount = env.document.querySelectorAll('*').length;
  }

  return { timing: computeStats(timings), elementCount };
}

export async function execute(args: ParsedArgs): Promise<CommandResult> {
  if (!args.url) {
    return {
      exitCode: 1,
      errors: [{ code: 'MISSING_URL', message: 'bench requires a URL' }],
    };
  }

  // Fetch HTML from URL; gracefully handle unreachable servers
  let html = '';
  try {
    const response = await fetch(args.url);
    html = await response.text();
  } catch {
    // No server / unreachable — benchmark with empty HTML (measures parse overhead)
  }

  const result = await runBenchmark({ html, iterations: 100 });
  const output = formatOutput(result, args.format ?? 'json');
  return { exitCode: 0, output, data: result };
}
