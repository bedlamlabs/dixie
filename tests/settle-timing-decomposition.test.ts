/**
 * Tests for settle timing decomposition in journey benchmarks.
 * Covers acceptance criteria 4, 5 and edge case relating to timing accuracy.
 */
import { describe, it, expect } from 'vitest';

import { decomposeSettleTiming } from '../src/benchmark/settle-timing';
import { parseArgs } from '../src/cli';
import { computeStats } from '../src/cli/commands/bench';

describe('settle timing decomposition', () => {
  it('returns networkWaitMs, renderMs, idleMs, and totalMs', () => {
    const result = decomposeSettleTiming({
      navigationStart: 0,
      networkQuietAt: 100,
      lastMutationAt: 120,
      settledAt: 150,
    });

    expect(result).toHaveProperty('networkWaitMs');
    expect(result).toHaveProperty('renderMs');
    expect(result).toHaveProperty('idleMs');
    expect(result).toHaveProperty('totalMs');
  });

  it('networkWaitMs = networkQuietAt - navigationStart', () => {
    const result = decomposeSettleTiming({
      navigationStart: 0,
      networkQuietAt: 200,
      lastMutationAt: 250,
      settledAt: 300,
    });

    expect(result.networkWaitMs).toBe(200);
  });

  it('renderMs = lastMutationAt - networkQuietAt', () => {
    const result = decomposeSettleTiming({
      navigationStart: 0,
      networkQuietAt: 200,
      lastMutationAt: 250,
      settledAt: 300,
    });

    expect(result.renderMs).toBe(50);
  });

  it('idleMs = settledAt - lastMutationAt', () => {
    const result = decomposeSettleTiming({
      navigationStart: 0,
      networkQuietAt: 200,
      lastMutationAt: 250,
      settledAt: 300,
    });

    expect(result.idleMs).toBe(50);
  });

  it('totalMs = settledAt - navigationStart', () => {
    const result = decomposeSettleTiming({
      navigationStart: 10,
      networkQuietAt: 200,
      lastMutationAt: 250,
      settledAt: 310,
    });

    expect(result.totalMs).toBe(300);
  });

  it('handles zero network wait (no fetch calls)', () => {
    const result = decomposeSettleTiming({
      navigationStart: 0,
      networkQuietAt: 0,
      lastMutationAt: 50,
      settledAt: 80,
    });

    expect(result.networkWaitMs).toBe(0);
    expect(result.renderMs).toBe(50);
    expect(result.idleMs).toBe(30);
    expect(result.totalMs).toBe(80);
  });

  it('handles instant render (no mutations after network)', () => {
    const result = decomposeSettleTiming({
      navigationStart: 0,
      networkQuietAt: 100,
      lastMutationAt: 100,
      settledAt: 150,
    });

    expect(result.networkWaitMs).toBe(100);
    expect(result.renderMs).toBe(0);
    expect(result.idleMs).toBe(50);
  });

  it('all components sum to totalMs', () => {
    const result = decomposeSettleTiming({
      navigationStart: 5,
      networkQuietAt: 105,
      lastMutationAt: 155,
      settledAt: 205,
    });

    expect(result.networkWaitMs + result.renderMs + result.idleMs).toBe(result.totalMs);
  });
});

describe('benchmark --samples default', () => {
  it('default samples value is 5', () => {
    const args = parseArgs(['bench', 'http://localhost:3000/']);
    expect((args as any).samples).toBe(5);
  });
});

describe('benchmark statistical output', () => {
  it('computeStats returns median, mean, p95, min, max', () => {
    const values = [10, 20, 30, 40, 50];
    const stats = computeStats(values);

    expect(stats).toHaveProperty('median');
    expect(stats).toHaveProperty('mean');
    expect(stats).toHaveProperty('p95');
    expect(stats).toHaveProperty('min');
    expect(stats).toHaveProperty('max');
    expect(stats.min).toBe(10);
    expect(stats.max).toBe(50);
    expect(stats.median).toBe(30);
    expect(stats.mean).toBe(30);
  });
});
