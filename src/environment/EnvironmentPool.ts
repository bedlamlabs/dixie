/**
 * EnvironmentPool — pre-allocate and reuse DixieEnvironment instances
 * for blazing-fast parallel test execution.
 *
 * Usage:
 * ```ts
 * const pool = new EnvironmentPool({ size: 4, maxSize: 16 });
 * const env = pool.acquire();  // get a fresh (reset) environment
 * // ... use env ...
 * pool.release(env);           // return to pool for reuse
 *
 * // Or use the auto-release pattern:
 * pool.withEnvironment(env => {
 *   env.document.body.innerHTML = '<div>test</div>';
 *   return env.document.body.textContent;
 * });
 *
 * pool.drain();                // destroy all pooled environments
 * ```
 */

import { createDixieEnvironment, type DixieEnvironment, type DixieEnvironmentOptions } from './DixieEnvironment';

// ── Types ────────────────────────────────────────────────────────────────

export interface PoolOptions {
  /** Initial pool size (default: 4) */
  size?: number;
  /** Maximum pool growth (default: 16) */
  maxSize?: number;
  /** Create environments eagerly on construction (default: true) */
  preWarm?: boolean;
  /** Auto-reset environment when returned to pool (default: true) */
  resetOnRelease?: boolean;
  /** Options passed to createDixieEnvironment for each environment */
  environmentOptions?: DixieEnvironmentOptions;
}

export interface PoolStats {
  /** Total environments created (available + in use) */
  total: number;
  /** Currently idle in pool */
  available: number;
  /** Currently checked out */
  inUse: number;
  /** High water mark for concurrent usage */
  peakInUse: number;
  /** Total number of acquire() calls */
  acquireCount: number;
  /** Total number of resets performed */
  resetCount: number;
}

// ── EnvironmentPool ──────────────────────────────────────────────────────

export class EnvironmentPool {
  private _available: DixieEnvironment[] = [];
  private _inUse: Set<DixieEnvironment> = new Set();
  private _envOptions: DixieEnvironmentOptions | undefined;
  private _maxSize: number;
  private _resetOnRelease: boolean;
  private _drained = false;

  // Stats tracking
  private _peakInUse = 0;
  private _acquireCount = 0;
  private _resetCount = 0;
  private _totalCreated = 0;

  constructor(options?: PoolOptions) {
    const size = options?.size ?? 4;
    const preWarm = options?.preWarm ?? true;
    this._maxSize = options?.maxSize ?? 16;
    this._resetOnRelease = options?.resetOnRelease ?? true;
    this._envOptions = options?.environmentOptions;

    // Validate: size must not exceed maxSize
    if (size > this._maxSize) {
      throw new Error(`Pool size (${size}) cannot exceed maxSize (${this._maxSize}).`);
    }

    // Pre-warm: create environments eagerly
    if (preWarm) {
      for (let i = 0; i < size; i++) {
        this._available.push(createDixieEnvironment(this._envOptions));
        this._totalCreated++;
      }
    }
  }

  /** Number of environments currently available in the pool. */
  get availableCount(): number {
    return this._available.length;
  }

  /** Number of environments currently checked out. */
  get inUseCount(): number {
    return this._inUse.size;
  }

  /** Total environments managed by this pool (available + in use). */
  get totalCount(): number {
    return this._available.length + this._inUse.size;
  }

  /**
   * Acquire a fresh (reset) environment from the pool.
   * Returns from pool if available, creates new if pool empty (up to maxSize).
   * Throws if at maxSize with all environments in use.
   */
  acquire(): DixieEnvironment {
    if (this._drained) {
      throw new Error('EnvironmentPool has been drained and cannot be used.');
    }

    let env: DixieEnvironment;
    if (this._available.length > 0) {
      env = this._available.pop()!;
      // Reset it to ensure clean state
      env.reset();
      this._resetCount++;
    } else if (this.totalCount < this._maxSize) {
      // Pool exhausted but under maxSize — create a new one on-demand
      env = createDixieEnvironment(this._envOptions);
      this._totalCreated++;
    } else {
      throw new Error(
        `EnvironmentPool exhausted: all ${this._maxSize} environments are in use. ` +
        `Increase maxSize or release environments before acquiring more.`
      );
    }

    this._inUse.add(env);
    this._acquireCount++;

    // Track peak
    if (this._inUse.size > this._peakInUse) {
      this._peakInUse = this._inUse.size;
    }

    return env;
  }

  /**
   * Return an environment to the pool for reuse.
   * Resets the environment if resetOnRelease is true.
   */
  release(env: DixieEnvironment): void {
    if (this._drained) {
      throw new Error('EnvironmentPool has been drained and cannot be used.');
    }

    if (!this._inUse.has(env)) {
      throw new Error('Cannot release an environment that was not acquired from this pool.');
    }

    this._inUse.delete(env);

    if (this._resetOnRelease) {
      env.reset();
      this._resetCount++;
    }

    this._available.push(env);
  }

  /**
   * Execute a function with a pooled environment.
   * Automatically acquires before and releases after, even if fn throws.
   */
  withEnvironment<T>(fn: (env: DixieEnvironment) => T): T {
    const env = this.acquire();
    try {
      return fn(env);
    } finally {
      this.release(env);
    }
  }

  /**
   * Async version of withEnvironment.
   * Automatically acquires before and releases after, even if fn rejects.
   */
  async withEnvironmentAsync<T>(fn: (env: DixieEnvironment) => Promise<T>): Promise<T> {
    const env = this.acquire();
    try {
      return await fn(env);
    } finally {
      this.release(env);
    }
  }

  /**
   * Pool statistics for performance monitoring.
   */
  stats(): PoolStats {
    return {
      total: this.totalCount,
      available: this._available.length,
      inUse: this._inUse.size,
      peakInUse: this._peakInUse,
      acquireCount: this._acquireCount,
      resetCount: this._resetCount,
    };
  }

  /**
   * Drain pool — destroy all idle environments.
   * In-use environments are also destroyed and the pool is marked as drained.
   * After calling drain(), the pool cannot be used.
   */
  drain(): void {
    if (this._drained) return;

    for (const env of this._available) {
      env.destroy();
    }
    this._available.length = 0;

    for (const env of this._inUse) {
      env.destroy();
    }
    this._inUse.clear();

    this._drained = true;
  }

  /**
   * Pre-warm the pool to a target size.
   * Creates additional environments up to the given count (or initial size).
   * Does not exceed maxSize.
   */
  warmUp(count?: number): void {
    if (this._drained) {
      throw new Error('EnvironmentPool has been drained and cannot be used.');
    }

    const target = count ?? (this._maxSize - this.totalCount);
    const toCreate = Math.min(target, this._maxSize - this.totalCount);

    for (let i = 0; i < toCreate; i++) {
      this._available.push(createDixieEnvironment(this._envOptions));
      this._totalCreated++;
    }
  }
}
