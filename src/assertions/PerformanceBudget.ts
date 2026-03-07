/**
 * PerformanceBudget — fail tests if operations exceed time limits.
 *
 * Usage:
 * ```ts
 * const budget = new PerformanceBudget({ renderMs: 100, totalMs: 500 });
 *
 * budget.start('render');
 * // ... render something ...
 * budget.end('render');
 *
 * // Or use the wrapper:
 * const result = budget.time('parse', () => parseHTML(html));
 *
 * const check = budget.check();
 * if (!check.passed) {
 *   console.log('Budget violations:', check.violations);
 * }
 * ```
 */

// ── Types ────────────────────────────────────────────────────────────────

export interface BudgetConfig {
  /** Max render time in ms (default: 100) */
  renderMs?: number;
  /** Max HTML parse time in ms (default: 50) */
  parseMs?: number;
  /** Max mock fetch time in ms (default: 10) */
  fetchMs?: number;
  /** Max total test time in ms (default: 500) */
  totalMs?: number;
}

export interface BudgetViolation {
  operation: string;
  limit: number;
  actual: number;
  overBy: number;
}

export interface BudgetResult {
  passed: boolean;
  violations: BudgetViolation[];
  timings: Record<string, number>;
}

// ── Default budget values ────────────────────────────────────────────────

const DEFAULT_BUDGET: Required<BudgetConfig> = {
  renderMs: 100,
  parseMs: 50,
  fetchMs: 10,
  totalMs: 500,
};

// ── Budget key mapping ───────────────────────────────────────────────────

/** Maps operation names to their budget config key. */
const BUDGET_KEY_MAP: Record<string, keyof Required<BudgetConfig>> = {
  render: 'renderMs',
  parse: 'parseMs',
  fetch: 'fetchMs',
  total: 'totalMs',
};

// ── PerformanceBudget ────────────────────────────────────────────────────

export class PerformanceBudget {
  private _config: Required<BudgetConfig>;
  private _timings: Map<string, number> = new Map();
  private _starts: Map<string, number> = new Map();

  constructor(config?: BudgetConfig) {
    this._config = {
      renderMs: config?.renderMs ?? DEFAULT_BUDGET.renderMs,
      parseMs: config?.parseMs ?? DEFAULT_BUDGET.parseMs,
      fetchMs: config?.fetchMs ?? DEFAULT_BUDGET.fetchMs,
      totalMs: config?.totalMs ?? DEFAULT_BUDGET.totalMs,
    };
  }

  /**
   * Start timing an operation.
   */
  start(operation: string): void {
    this._starts.set(operation, performance.now());
  }

  /**
   * End timing an operation.
   * Throws if start() was not called for this operation.
   */
  end(operation: string): void {
    const startTime = this._starts.get(operation);
    if (startTime === undefined) {
      throw new Error(`PerformanceBudget: start() was not called for operation '${operation}'.`);
    }

    const elapsed = performance.now() - startTime;
    this._timings.set(operation, elapsed);
    this._starts.delete(operation);
  }

  /**
   * Time a synchronous function.
   * Records the elapsed time under the given operation name.
   */
  time<T>(operation: string, fn: () => T): T {
    this.start(operation);
    try {
      const result = fn();
      this.end(operation);
      return result;
    } catch (err) {
      this.end(operation);
      throw err;
    }
  }

  /**
   * Time an async function.
   * Records the elapsed time under the given operation name.
   */
  async timeAsync<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    this.start(operation);
    try {
      const result = await fn();
      this.end(operation);
      return result;
    } catch (err) {
      this.end(operation);
      throw err;
    }
  }

  /**
   * Check all timings against the budget.
   * Returns a result with pass/fail status and any violations.
   */
  check(): BudgetResult {
    const violations: BudgetViolation[] = [];
    const timings: Record<string, number> = {};

    for (const [operation, elapsed] of this._timings) {
      timings[operation] = elapsed;

      // Look up the budget limit for this operation
      const budgetKey = BUDGET_KEY_MAP[operation];
      if (budgetKey) {
        const limit = this._config[budgetKey];
        if (elapsed > limit) {
          violations.push({
            operation,
            limit,
            actual: elapsed,
            overBy: elapsed - limit,
          });
        }
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      timings,
    };
  }

  /**
   * Reset all timings and in-progress starts.
   */
  reset(): void {
    this._timings.clear();
    this._starts.clear();
  }
}
