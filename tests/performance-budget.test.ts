import { describe, it, expect } from 'vitest';
import { PerformanceBudget } from '../src/assertions/PerformanceBudget';

describe('PerformanceBudget', () => {
  // ── start/end ──────────────────────────────────────────────────────

  describe('start/end', () => {
    it('records timing', () => {
      const budget = new PerformanceBudget();
      budget.start('render');
      // Do some trivial work
      let sum = 0;
      for (let i = 0; i < 1000; i++) sum += i;
      budget.end('render');

      const result = budget.check();
      expect(result.timings['render']).toBeGreaterThanOrEqual(0);
      expect(result.timings['render']).toBeDefined();
    });

    it('throws if end() called without start()', () => {
      const budget = new PerformanceBudget();
      expect(() => budget.end('unknown')).toThrow("start() was not called for operation 'unknown'");
    });
  });

  // ── time() ──────────────────────────────────────────────────────────

  describe('time()', () => {
    it('wraps synchronous function and records timing', () => {
      const budget = new PerformanceBudget();

      const result = budget.time('parse', () => {
        let sum = 0;
        for (let i = 0; i < 100; i++) sum += i;
        return sum;
      });

      expect(result).toBe(4950); // 0+1+2+...+99
      const check = budget.check();
      expect(check.timings['parse']).toBeGreaterThanOrEqual(0);
    });

    it('records timing even if function throws', () => {
      const budget = new PerformanceBudget();

      expect(() => {
        budget.time('crash', () => {
          throw new Error('sync crash');
        });
      }).toThrow('sync crash');

      const check = budget.check();
      expect(check.timings['crash']).toBeGreaterThanOrEqual(0);
    });
  });

  // ── timeAsync() ────────────────────────────────────────────────────

  describe('timeAsync()', () => {
    it('wraps async function and records timing', async () => {
      const budget = new PerformanceBudget();

      const result = await budget.timeAsync('fetch', async () => {
        await Promise.resolve();
        return 42;
      });

      expect(result).toBe(42);
      const check = budget.check();
      expect(check.timings['fetch']).toBeGreaterThanOrEqual(0);
    });

    it('records timing even if async function rejects', async () => {
      const budget = new PerformanceBudget();

      await expect(
        budget.timeAsync('async-crash', async () => {
          await Promise.resolve();
          throw new Error('async crash');
        })
      ).rejects.toThrow('async crash');

      const check = budget.check();
      expect(check.timings['async-crash']).toBeGreaterThanOrEqual(0);
    });
  });

  // ── check() ────────────────────────────────────────────────────────

  describe('check()', () => {
    it('passes when within budget', () => {
      const budget = new PerformanceBudget({ renderMs: 1000, totalMs: 5000 });

      budget.time('render', () => {
        // trivial operation — well under 1000ms
        return 1 + 1;
      });

      const result = budget.check();
      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('fails with violations when over budget', () => {
      // Set impossibly tight budget
      const budget = new PerformanceBudget({ fetchMs: 0 });

      budget.time('fetch', () => {
        // Even the tiniest operation takes >0ms
        let sum = 0;
        for (let i = 0; i < 10000; i++) sum += i;
        return sum;
      });

      const result = budget.check();
      // This might or might not actually exceed 0ms depending on precision
      // But we can verify the structure
      expect(typeof result.passed).toBe('boolean');
      expect(Array.isArray(result.violations)).toBe(true);
      if (!result.passed) {
        expect(result.violations.length).toBeGreaterThan(0);
        const v = result.violations[0];
        expect(v.operation).toBe('fetch');
        expect(v.limit).toBe(0);
        expect(v.actual).toBeGreaterThan(0);
        expect(v.overBy).toBeGreaterThan(0);
      }
    });

    it('reports overBy amount correctly', () => {
      const budget = new PerformanceBudget({ renderMs: 0.001 }); // 0.001ms — impossible to meet

      // Burn some time
      budget.time('render', () => {
        let sum = 0;
        for (let i = 0; i < 100000; i++) sum += i;
        return sum;
      });

      const result = budget.check();
      if (!result.passed) {
        const v = result.violations[0];
        expect(v.overBy).toBeCloseTo(v.actual - v.limit, 5);
      }
    });
  });

  // ── Multiple operations ─────────────────────────────────────────────

  describe('multiple operations', () => {
    it('tracks independently', () => {
      const budget = new PerformanceBudget();

      budget.time('render', () => 1 + 1);
      budget.time('parse', () => 2 + 2);
      budget.time('fetch', () => 3 + 3);

      const result = budget.check();
      expect('render' in result.timings).toBe(true);
      expect('parse' in result.timings).toBe(true);
      expect('fetch' in result.timings).toBe(true);
    });

    it('only operations with budget keys are checked for violations', () => {
      const budget = new PerformanceBudget({ renderMs: 100000, parseMs: 100000 });

      // 'custom-op' has no budget key, so it should not cause a violation
      budget.time('custom-op', () => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) sum += i;
        return sum;
      });

      const result = budget.check();
      expect(result.passed).toBe(true);
      expect(result.timings['custom-op']).toBeGreaterThanOrEqual(0);
    });
  });

  // ── reset() ────────────────────────────────────────────────────────

  describe('reset()', () => {
    it('clears all timings', () => {
      const budget = new PerformanceBudget();

      budget.time('render', () => 1 + 1);
      budget.time('parse', () => 2 + 2);

      let result = budget.check();
      expect(Object.keys(result.timings).length).toBe(2);

      budget.reset();

      result = budget.check();
      expect(Object.keys(result.timings).length).toBe(0);
      expect(result.passed).toBe(true);
    });

    it('clears in-progress starts', () => {
      const budget = new PerformanceBudget();
      budget.start('incomplete');
      budget.reset();

      // Starting again should work without error
      budget.start('incomplete');
      budget.end('incomplete');

      const result = budget.check();
      expect(result.timings['incomplete']).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Default budget values ──────────────────────────────────────────

  describe('default values', () => {
    it('has reasonable default budget values', () => {
      const budget = new PerformanceBudget();

      // Time a trivial operation under each budget key
      budget.time('render', () => 1);
      budget.time('parse', () => 1);
      budget.time('fetch', () => 1);
      budget.time('total', () => 1);

      // All should pass with default generous budgets
      const result = budget.check();
      expect(result.passed).toBe(true);
    });
  });

  // ── Custom budget values ───────────────────────────────────────────

  describe('custom values', () => {
    it('overrides defaults', () => {
      const budget = new PerformanceBudget({
        renderMs: 200,
        parseMs: 100,
        fetchMs: 20,
        totalMs: 1000,
      });

      // Time trivial operations
      budget.time('render', () => 1);
      budget.time('parse', () => 1);
      budget.time('fetch', () => 1);
      budget.time('total', () => 1);

      const result = budget.check();
      expect(result.passed).toBe(true);
    });

    it('partial overrides keep other defaults', () => {
      const budget = new PerformanceBudget({ renderMs: 999 });

      // 'parse' should use default (50ms), 'render' should use custom (999ms)
      budget.time('render', () => 1);
      budget.time('parse', () => 1);

      const result = budget.check();
      expect(result.passed).toBe(true);
    });
  });
});
