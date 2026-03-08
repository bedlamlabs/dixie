/**
 * Timers — provides setTimeout, setInterval, requestAnimationFrame with
 * a switchable real/fake mode for deterministic testing.
 *
 * In REAL mode: delegates to native Node.js timer functions.
 * In FAKE mode: maintains a sorted queue of pending callbacks, advanced
 * manually via tick(), advanceTo(), or runAll().
 *
 * Timer IDs are globally unique incrementing integers across both modes.
 */

// ── Internal types ──────────────────────────────────────────────────────

interface PendingTimer {
  id: number;
  callback: (...args: unknown[]) => void;
  args: unknown[];
  scheduledTime: number;
  interval: number | null; // null = timeout/rAF, positive = interval period
  type: 'timeout' | 'interval' | 'raf';
  registrationOrder: number; // tie-breaker for same-time callbacks
}

type TimerMode = 'real' | 'fake';

// Frame time constant for requestAnimationFrame in fake mode (~60fps)
const RAF_FRAME_TIME = 16;

// Guard against infinite loops in runAll
const MAX_RUN_ALL_ITERATIONS = 1000;

/**
 * TimerHandle — a number-like object with .ref() and .unref() stubs.
 * Node.js internals (undici/fetch) call .unref() on setTimeout return values.
 * Without these stubs, native fetch crashes inside a Dixie environment.
 */
interface TimerHandle {
  ref(): TimerHandle;
  unref(): TimerHandle;
  hasRef(): boolean;
  [Symbol.toPrimitive](hint: string): number;
}

function _wrapTimerHandle(id: number): TimerHandle {
  return {
    ref() { return this; },
    unref() { return this; },
    hasRef() { return true; },
    [Symbol.toPrimitive]() { return id; },
  };
}

// ── Capture native timer functions before installGlobals can replace them ──

const _nativeSetTimeout = globalThis.setTimeout;
const _nativeClearTimeout = globalThis.clearTimeout;
const _nativeSetInterval = globalThis.setInterval;
const _nativeClearInterval = globalThis.clearInterval;

// ── TimerController class ───────────────────────────────────────────────

export class TimerController {
  private _mode: TimerMode = 'real';
  private _nextId: number = 1;
  private _registrationCounter: number = 0;
  private _fakeNow: number = 0;

  // Fake mode queue — kept sorted by (scheduledTime, registrationOrder)
  private _pending: PendingTimer[] = [];

  // Real mode handle tracking (our ID -> native handle)
  private _realHandles: Map<number, ReturnType<typeof globalThis.setTimeout>> = new Map();

  // Set of IDs cleared during the current callback execution (for interval self-clearing)
  private _clearedDuringExecution: Set<number> = new Set();
  private _isExecutingCallback: boolean = false;

  // ── Mode switching ──────────────────────────────────────────────────

  /**
   * Switch to fake timer mode. Resets fake time to 0 and clears the queue.
   */
  useFakeTimers(): void {
    this._mode = 'fake';
    this._fakeNow = 0;
    this._pending = [];
    this._registrationCounter = 0;
  }

  /**
   * Switch back to real timer mode. Clears all pending fake timers.
   */
  useRealTimers(): void {
    this._mode = 'real';
    this._pending = [];
    this._fakeNow = 0;
    this._registrationCounter = 0;
  }

  // ── Timer creation ──────────────────────────────────────────────────

  setTimeout(callback: (...args: unknown[]) => void, delay: number = 0, ...args: unknown[]): TimerHandle {
    const id = this._nextId++;

    if (this._mode === 'real') {
      const handle = _nativeSetTimeout(() => {
        this._realHandles.delete(id);
        callback(...args);
      }, delay);
      this._realHandles.set(id, handle);
      return _wrapTimerHandle(id);
    }

    // Fake mode
    this._pending.push({
      id,
      callback,
      args,
      scheduledTime: this._fakeNow + Math.max(0, delay),
      interval: null,
      type: 'timeout',
      registrationOrder: this._registrationCounter++,
    });
    this._sortPending();
    return _wrapTimerHandle(id);
  }

  clearTimeout(id: number | TimerHandle): void {
    if (this._mode === 'real') {
      const handle = this._realHandles.get(id);
      if (handle !== undefined) {
        _nativeClearTimeout(handle);
        this._realHandles.delete(id);
      }
      return;
    }

    // Fake mode — remove from pending queue (no-op if ID not found)
    this._pending = this._pending.filter(t => t.id !== id);

    // Track if cleared during callback execution (for interval self-clearing)
    if (this._isExecutingCallback) {
      this._clearedDuringExecution.add(id);
    }
  }

  setInterval(callback: (...args: unknown[]) => void, delay: number = 0, ...args: unknown[]): TimerHandle {
    const id = this._nextId++;
    const period = Math.max(1, delay); // intervals with 0 delay clamp to 1ms

    if (this._mode === 'real') {
      const handle = _nativeSetInterval(() => {
        callback(...args);
      }, delay);
      this._realHandles.set(id, handle);
      return _wrapTimerHandle(id);
    }

    // Fake mode
    this._pending.push({
      id,
      callback,
      args,
      scheduledTime: this._fakeNow + period,
      interval: period,
      type: 'interval',
      registrationOrder: this._registrationCounter++,
    });
    this._sortPending();
    return _wrapTimerHandle(id);
  }

  clearInterval(id: number | TimerHandle): void {
    // clearTimeout and clearInterval are interchangeable per browser spec
    this.clearTimeout(id);
  }

  requestAnimationFrame(callback: (timestamp: number) => void): number {
    const id = this._nextId++;

    if (this._mode === 'real') {
      // Node.js has no native rAF — simulate with setTimeout(16ms)
      const handle = _nativeSetTimeout(() => {
        this._realHandles.delete(id);
        callback(Date.now());
      }, RAF_FRAME_TIME);
      this._realHandles.set(id, handle);
      return id;
    }

    // Fake mode — wraps callback to receive current fake time as timestamp
    const wrappedCallback = (): void => {
      callback(this._fakeNow);
    };

    this._pending.push({
      id,
      callback: wrappedCallback,
      args: [],
      scheduledTime: this._fakeNow + RAF_FRAME_TIME,
      interval: null,
      type: 'raf',
      registrationOrder: this._registrationCounter++,
    });
    this._sortPending();
    return id;
  }

  cancelAnimationFrame(id: number): void {
    this.clearTimeout(id);
  }

  // ── Fake timer control ──────────────────────────────────────────────

  /**
   * Advance fake time by `ms` milliseconds, executing all callbacks
   * whose scheduled time falls within [now, now + ms].
   */
  tick(ms: number): void {
    this._assertFakeMode('tick');
    const targetTime = this._fakeNow + ms;
    this._advanceTo(targetTime);
  }

  /**
   * Async version of tick — flushes microtasks between each callback execution.
   */
  async tickAsync(ms: number): Promise<void> {
    this._assertFakeMode('tickAsync');
    const targetTime = this._fakeNow + ms;
    await this._advanceToAsync(targetTime);
  }

  /**
   * Advance fake time to an absolute timestamp. No-op if timestamp is in
   * the past (before current fake time).
   */
  advanceTo(timestamp: number): void {
    this._assertFakeMode('advanceTo');
    if (timestamp <= this._fakeNow) return;
    this._advanceTo(timestamp);
  }

  /**
   * Execute ALL pending timers. Intervals will re-schedule, so this caps
   * at MAX_RUN_ALL_ITERATIONS to prevent infinite loops.
   */
  runAll(): void {
    this._assertFakeMode('runAll');
    let iterations = 0;

    while (this._pending.length > 0 && iterations < MAX_RUN_ALL_ITERATIONS) {
      const next = this._pending[0];
      this._fakeNow = next.scheduledTime;
      this._executeNext();
      iterations++;
    }

    if (iterations >= MAX_RUN_ALL_ITERATIONS && this._pending.length > 0) {
      throw new Error(
        `runAll() exceeded ${MAX_RUN_ALL_ITERATIONS} iterations. ` +
        `Likely an interval that never gets cleared. ` +
        `${this._pending.length} timers still pending.`
      );
    }
  }

  /**
   * Async version of runAll — flushes microtasks between each callback.
   */
  async runAllAsync(): Promise<void> {
    this._assertFakeMode('runAllAsync');
    let iterations = 0;

    while (this._pending.length > 0 && iterations < MAX_RUN_ALL_ITERATIONS) {
      const next = this._pending[0];
      this._fakeNow = next.scheduledTime;
      this._executeNext();
      await this._flushMicrotasks();
      iterations++;
    }

    if (iterations >= MAX_RUN_ALL_ITERATIONS && this._pending.length > 0) {
      throw new Error(
        `runAllAsync() exceeded ${MAX_RUN_ALL_ITERATIONS} iterations. ` +
        `Likely an interval that never gets cleared. ` +
        `${this._pending.length} timers still pending.`
      );
    }
  }

  /**
   * Return the number of pending timers.
   */
  getTimerCount(): number {
    if (this._mode === 'fake') {
      return this._pending.length;
    }
    return this._realHandles.size;
  }

  /**
   * Current time: returns fake time in fake mode, Date.now() in real mode.
   */
  now(): number {
    return this._mode === 'fake' ? this._fakeNow : Date.now();
  }

  /**
   * Clear all pending timers and reset fake time to 0.
   */
  reset(): void {
    // Clear real handles
    for (const handle of this._realHandles.values()) {
      _nativeClearTimeout(handle);
    }
    this._realHandles.clear();

    // Clear fake state
    this._pending = [];
    this._fakeNow = 0;
    this._registrationCounter = 0;
  }

  // ── Internal helpers ────────────────────────────────────────────────

  private _assertFakeMode(method: string): void {
    if (this._mode !== 'fake') {
      throw new Error(
        `${method}() can only be called in fake timer mode. Call useFakeTimers() first.`
      );
    }
  }

  private _sortPending(): void {
    this._pending.sort((a, b) => {
      if (a.scheduledTime !== b.scheduledTime) {
        return a.scheduledTime - b.scheduledTime;
      }
      return a.registrationOrder - b.registrationOrder;
    });
  }

  /**
   * Advance fake time to targetTime, executing callbacks in order.
   */
  private _advanceTo(targetTime: number): void {
    while (this._pending.length > 0) {
      const next = this._pending[0];
      if (next.scheduledTime > targetTime) break;

      this._fakeNow = next.scheduledTime;
      this._executeNext();
    }
    this._fakeNow = targetTime;
  }

  /**
   * Async version of _advanceTo — flushes microtasks between callbacks.
   */
  private async _advanceToAsync(targetTime: number): Promise<void> {
    while (this._pending.length > 0) {
      const next = this._pending[0];
      if (next.scheduledTime > targetTime) break;

      this._fakeNow = next.scheduledTime;
      this._executeNext();
      await this._flushMicrotasks();
    }
    this._fakeNow = targetTime;
  }

  /**
   * Shift and execute the first pending timer. If it's an interval,
   * re-schedule it unless it was cleared during its own callback.
   */
  private _executeNext(): void {
    if (this._pending.length === 0) return;

    const timer = this._pending.shift()!;

    this._isExecutingCallback = true;
    this._clearedDuringExecution.clear();

    try {
      timer.callback(...timer.args);
    } finally {
      this._isExecutingCallback = false;
    }

    // Re-schedule intervals unless the interval was cleared during execution
    if (timer.interval !== null && !this._clearedDuringExecution.has(timer.id)) {
      this._pending.push({
        ...timer,
        scheduledTime: this._fakeNow + timer.interval,
        registrationOrder: this._registrationCounter++,
      });
      this._sortPending();
    }

    this._clearedDuringExecution.clear();
  }

  private async _flushMicrotasks(): Promise<void> {
    await Promise.resolve();
  }
}
