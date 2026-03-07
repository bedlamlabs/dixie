import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TimerController } from '../src/browser/Timers';

// ═══════════════════════════════════════════════════════════════════════
// TimerController — Real mode
// ═══════════════════════════════════════════════════════════════════════

describe('TimerController — real mode', () => {
  let timers: TimerController;

  beforeEach(() => {
    timers = new TimerController();
  });

  afterEach(() => {
    timers.reset();
  });

  describe('setTimeout', () => {
    it('returns a numeric ID', () => {
      const id = timers.setTimeout(() => {}, 10);
      expect(typeof id).toBe('number');
      expect(id).toBeGreaterThan(0);
    });

    it('executes callback after delay', async () => {
      const fn = vi.fn();
      timers.setTimeout(fn, 5);
      expect(fn).not.toHaveBeenCalled();
      await vi.waitFor(() => expect(fn).toHaveBeenCalledOnce(), { timeout: 500 });
    });

    it('passes extra arguments to callback', async () => {
      const fn = vi.fn();
      timers.setTimeout(fn, 5, 'a', 42);
      await vi.waitFor(() => expect(fn).toHaveBeenCalledWith('a', 42), { timeout: 500 });
    });
  });

  describe('clearTimeout', () => {
    it('prevents callback from executing', async () => {
      const fn = vi.fn();
      const id = timers.setTimeout(fn, 5);
      timers.clearTimeout(id);
      // Wait longer than the delay to confirm it never fires
      await new Promise(r => globalThis.setTimeout(r, 50));
      expect(fn).not.toHaveBeenCalled();
    });

    it('is a no-op for non-existent ID', () => {
      expect(() => timers.clearTimeout(999999)).not.toThrow();
    });
  });

  describe('setInterval', () => {
    it('returns a numeric ID', () => {
      const id = timers.setInterval(() => {}, 10);
      expect(typeof id).toBe('number');
      timers.clearInterval(id);
    });

    it('executes callback repeatedly', async () => {
      const fn = vi.fn();
      const id = timers.setInterval(fn, 10);
      await vi.waitFor(() => expect(fn.mock.calls.length).toBeGreaterThanOrEqual(2), { timeout: 500 });
      timers.clearInterval(id);
    });
  });

  describe('clearInterval', () => {
    it('stops interval from firing again', async () => {
      const fn = vi.fn();
      const id = timers.setInterval(fn, 5);
      await vi.waitFor(() => expect(fn).toHaveBeenCalled(), { timeout: 500 });
      timers.clearInterval(id);
      const countAfterClear = fn.mock.calls.length;
      await new Promise(r => globalThis.setTimeout(r, 50));
      expect(fn.mock.calls.length).toBe(countAfterClear);
    });
  });

  describe('requestAnimationFrame', () => {
    it('returns a numeric ID', () => {
      const id = timers.requestAnimationFrame(() => {});
      expect(typeof id).toBe('number');
    });

    it('executes callback with a timestamp', async () => {
      const fn = vi.fn();
      timers.requestAnimationFrame(fn);
      await vi.waitFor(() => expect(fn).toHaveBeenCalledOnce(), { timeout: 500 });
      expect(typeof fn.mock.calls[0][0]).toBe('number');
    });
  });

  describe('cancelAnimationFrame', () => {
    it('prevents rAF callback from executing', async () => {
      const fn = vi.fn();
      const id = timers.requestAnimationFrame(fn);
      timers.cancelAnimationFrame(id);
      await new Promise(r => globalThis.setTimeout(r, 50));
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('now()', () => {
    it('returns a value close to Date.now() in real mode', () => {
      const before = Date.now();
      const result = timers.now();
      const after = Date.now();
      expect(result).toBeGreaterThanOrEqual(before);
      expect(result).toBeLessThanOrEqual(after);
    });
  });

  describe('getTimerCount()', () => {
    it('tracks pending real timers', () => {
      expect(timers.getTimerCount()).toBe(0);
      const id1 = timers.setTimeout(() => {}, 1000);
      const id2 = timers.setTimeout(() => {}, 1000);
      expect(timers.getTimerCount()).toBe(2);
      timers.clearTimeout(id1);
      expect(timers.getTimerCount()).toBe(1);
      timers.clearTimeout(id2);
      expect(timers.getTimerCount()).toBe(0);
    });
  });

  describe('reset()', () => {
    it('clears all pending real timers', async () => {
      const fn = vi.fn();
      timers.setTimeout(fn, 5);
      timers.setTimeout(fn, 5);
      timers.reset();
      await new Promise(r => globalThis.setTimeout(r, 50));
      expect(fn).not.toHaveBeenCalled();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// TimerController — Fake mode: setTimeout / clearTimeout
// ═══════════════════════════════════════════════════════════════════════

describe('TimerController — fake mode: setTimeout', () => {
  let timers: TimerController;

  beforeEach(() => {
    timers = new TimerController();
    timers.useFakeTimers();
  });

  afterEach(() => {
    timers.reset();
  });

  it('returns incrementing numeric IDs', () => {
    const id1 = timers.setTimeout(() => {});
    const id2 = timers.setTimeout(() => {});
    expect(id2).toBeGreaterThan(id1);
  });

  it('does not execute callback immediately', () => {
    const fn = vi.fn();
    timers.setTimeout(fn, 100);
    expect(fn).not.toHaveBeenCalled();
  });

  it('executes callback when time is ticked past delay', () => {
    const fn = vi.fn();
    timers.setTimeout(fn, 100);
    timers.tick(100);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('does not execute callback when ticked less than delay', () => {
    const fn = vi.fn();
    timers.setTimeout(fn, 100);
    timers.tick(50);
    expect(fn).not.toHaveBeenCalled();
  });

  it('executes callback with 0ms delay on tick(0)', () => {
    const fn = vi.fn();
    timers.setTimeout(fn, 0);
    timers.tick(0);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('executes callback with no delay argument on tick(0)', () => {
    const fn = vi.fn();
    timers.setTimeout(fn);
    timers.tick(0);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('passes extra arguments to callback', () => {
    const fn = vi.fn();
    timers.setTimeout(fn, 10, 'hello', 42);
    timers.tick(10);
    expect(fn).toHaveBeenCalledWith('hello', 42);
  });

  it('executes multiple timeouts in scheduled order', () => {
    const order: number[] = [];
    timers.setTimeout(() => order.push(1), 100);
    timers.setTimeout(() => order.push(2), 50);
    timers.setTimeout(() => order.push(3), 200);
    timers.tick(200);
    expect(order).toEqual([2, 1, 3]);
  });

  it('executes same-time callbacks in registration order', () => {
    const order: number[] = [];
    timers.setTimeout(() => order.push(1), 50);
    timers.setTimeout(() => order.push(2), 50);
    timers.setTimeout(() => order.push(3), 50);
    timers.tick(50);
    expect(order).toEqual([1, 2, 3]);
  });

  it('clearTimeout prevents execution', () => {
    const fn = vi.fn();
    const id = timers.setTimeout(fn, 100);
    timers.clearTimeout(id);
    timers.tick(200);
    expect(fn).not.toHaveBeenCalled();
  });

  it('clearTimeout on already-executed timer is a no-op', () => {
    const fn = vi.fn();
    const id = timers.setTimeout(fn, 10);
    timers.tick(10);
    expect(fn).toHaveBeenCalledOnce();
    expect(() => timers.clearTimeout(id)).not.toThrow();
  });

  it('clearTimeout on non-existent ID is a no-op', () => {
    expect(() => timers.clearTimeout(999999)).not.toThrow();
  });

  it('nested setTimeout — callback can schedule new timers', () => {
    const order: number[] = [];
    timers.setTimeout(() => {
      order.push(1);
      timers.setTimeout(() => order.push(2), 50);
    }, 50);

    timers.tick(50);
    expect(order).toEqual([1]);

    timers.tick(50);
    expect(order).toEqual([1, 2]);
  });

  it('clearInterval can clear a timeout (interchangeable)', () => {
    const fn = vi.fn();
    const id = timers.setTimeout(fn, 100);
    timers.clearInterval(id);
    timers.tick(200);
    expect(fn).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// TimerController — Fake mode: setInterval / clearInterval
// ═══════════════════════════════════════════════════════════════════════

describe('TimerController — fake mode: setInterval', () => {
  let timers: TimerController;

  beforeEach(() => {
    timers = new TimerController();
    timers.useFakeTimers();
  });

  afterEach(() => {
    timers.reset();
  });

  it('fires at the interval period', () => {
    const fn = vi.fn();
    timers.setInterval(fn, 100);
    timers.tick(100);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('fires multiple times across multiple ticks', () => {
    const fn = vi.fn();
    timers.setInterval(fn, 100);
    timers.tick(100);
    expect(fn).toHaveBeenCalledTimes(1);
    timers.tick(100);
    expect(fn).toHaveBeenCalledTimes(2);
    timers.tick(100);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('fires multiple times in a single large tick', () => {
    const fn = vi.fn();
    timers.setInterval(fn, 100);
    timers.tick(350);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not fire before the first interval', () => {
    const fn = vi.fn();
    timers.setInterval(fn, 100);
    timers.tick(50);
    expect(fn).not.toHaveBeenCalled();
  });

  it('passes extra arguments to callback', () => {
    const fn = vi.fn();
    timers.setInterval(fn, 50, 'x', 99);
    timers.tick(50);
    expect(fn).toHaveBeenCalledWith('x', 99);
  });

  it('clearInterval stops future executions', () => {
    const fn = vi.fn();
    const id = timers.setInterval(fn, 100);
    timers.tick(100);
    expect(fn).toHaveBeenCalledTimes(1);
    timers.clearInterval(id);
    timers.tick(200);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('interval can clear itself during callback', () => {
    let count = 0;
    let intervalId: number;
    intervalId = timers.setInterval(() => {
      count++;
      if (count >= 3) {
        timers.clearInterval(intervalId);
      }
    }, 100);

    timers.tick(500);
    expect(count).toBe(3);
  });

  it('clearTimeout can clear an interval (interchangeable)', () => {
    const fn = vi.fn();
    const id = timers.setInterval(fn, 100);
    timers.clearTimeout(id);
    timers.tick(300);
    expect(fn).not.toHaveBeenCalled();
  });

  it('0ms interval clamps to 1ms', () => {
    const fn = vi.fn();
    timers.setInterval(fn, 0);
    timers.tick(1);
    expect(fn).toHaveBeenCalledTimes(1);
    timers.tick(1);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// TimerController — Fake mode: requestAnimationFrame
// ═══════════════════════════════════════════════════════════════════════

describe('TimerController — fake mode: requestAnimationFrame', () => {
  let timers: TimerController;

  beforeEach(() => {
    timers = new TimerController();
    timers.useFakeTimers();
  });

  afterEach(() => {
    timers.reset();
  });

  it('returns a numeric ID', () => {
    const id = timers.requestAnimationFrame(() => {});
    expect(typeof id).toBe('number');
    expect(id).toBeGreaterThan(0);
  });

  it('fires after 16ms (one frame)', () => {
    const fn = vi.fn();
    timers.requestAnimationFrame(fn);
    timers.tick(15);
    expect(fn).not.toHaveBeenCalled();
    timers.tick(1);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('callback receives current fake time as timestamp', () => {
    let received: number | undefined;
    timers.requestAnimationFrame((ts) => { received = ts; });
    timers.tick(16);
    expect(received).toBe(16);
  });

  it('cancelAnimationFrame prevents execution', () => {
    const fn = vi.fn();
    const id = timers.requestAnimationFrame(fn);
    timers.cancelAnimationFrame(id);
    timers.tick(100);
    expect(fn).not.toHaveBeenCalled();
  });

  it('multiple rAF callbacks fire in registration order at same time', () => {
    const order: number[] = [];
    timers.requestAnimationFrame(() => order.push(1));
    timers.requestAnimationFrame(() => order.push(2));
    timers.requestAnimationFrame(() => order.push(3));
    timers.tick(16);
    expect(order).toEqual([1, 2, 3]);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// TimerController — Fake mode: tick, advanceTo, runAll
// ═══════════════════════════════════════════════════════════════════════

describe('TimerController — fake timer control', () => {
  let timers: TimerController;

  beforeEach(() => {
    timers = new TimerController();
    timers.useFakeTimers();
  });

  afterEach(() => {
    timers.reset();
  });

  describe('tick', () => {
    it('advances now() by the specified amount', () => {
      expect(timers.now()).toBe(0);
      timers.tick(100);
      expect(timers.now()).toBe(100);
      timers.tick(50);
      expect(timers.now()).toBe(150);
    });

    it('tick(0) fires callbacks scheduled at current time', () => {
      const fn = vi.fn();
      timers.setTimeout(fn, 0);
      timers.tick(0);
      expect(fn).toHaveBeenCalledOnce();
    });

    it('throws in real mode', () => {
      timers.useRealTimers();
      expect(() => timers.tick(10)).toThrow(/fake timer mode/);
    });
  });

  describe('tickAsync', () => {
    it('executes callbacks and flushes microtasks', async () => {
      const order: string[] = [];
      timers.setTimeout(() => {
        order.push('timer');
        Promise.resolve().then(() => order.push('microtask'));
      }, 10);

      await timers.tickAsync(10);
      expect(order).toEqual(['timer', 'microtask']);
    });
  });

  describe('advanceTo', () => {
    it('advances to absolute timestamp', () => {
      timers.tick(50);
      const fn = vi.fn();
      timers.setTimeout(fn, 50); // fires at 100
      timers.advanceTo(100);
      expect(fn).toHaveBeenCalledOnce();
      expect(timers.now()).toBe(100);
    });

    it('is a no-op if timestamp is in the past', () => {
      timers.tick(100);
      const fn = vi.fn();
      timers.setTimeout(fn, 50); // fires at 150
      timers.advanceTo(50); // before current time — no-op
      expect(fn).not.toHaveBeenCalled();
      expect(timers.now()).toBe(100);
    });

    it('is a no-op if timestamp equals current time', () => {
      timers.tick(100);
      timers.advanceTo(100);
      expect(timers.now()).toBe(100);
    });

    it('throws in real mode', () => {
      timers.useRealTimers();
      expect(() => timers.advanceTo(100)).toThrow(/fake timer mode/);
    });
  });

  describe('runAll', () => {
    it('executes all pending timeouts', () => {
      const order: number[] = [];
      timers.setTimeout(() => order.push(1), 300);
      timers.setTimeout(() => order.push(2), 100);
      timers.setTimeout(() => order.push(3), 200);
      timers.runAll();
      expect(order).toEqual([2, 3, 1]);
    });

    it('is a no-op with no pending timers', () => {
      expect(() => timers.runAll()).not.toThrow();
    });

    it('handles nested timeouts', () => {
      const order: number[] = [];
      timers.setTimeout(() => {
        order.push(1);
        timers.setTimeout(() => order.push(2), 100);
      }, 50);

      timers.runAll();
      expect(order).toEqual([1, 2]);
    });

    it('throws after 1000 iterations to prevent infinite interval loops', () => {
      timers.setInterval(() => {}, 1);
      expect(() => timers.runAll()).toThrow(/exceeded 1000 iterations/);
    });

    it('throws in real mode', () => {
      timers.useRealTimers();
      expect(() => timers.runAll()).toThrow(/fake timer mode/);
    });
  });

  describe('runAllAsync', () => {
    it('executes all pending timeouts with microtask flushing', async () => {
      const order: string[] = [];
      timers.setTimeout(() => {
        order.push('timer1');
        Promise.resolve().then(() => order.push('micro1'));
      }, 50);
      timers.setTimeout(() => {
        order.push('timer2');
      }, 100);

      await timers.runAllAsync();
      expect(order).toEqual(['timer1', 'micro1', 'timer2']);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// TimerController — getTimerCount, now, reset
// ═══════════════════════════════════════════════════════════════════════

describe('TimerController — state methods', () => {
  let timers: TimerController;

  beforeEach(() => {
    timers = new TimerController();
    timers.useFakeTimers();
  });

  afterEach(() => {
    timers.reset();
  });

  describe('getTimerCount', () => {
    it('returns 0 when no timers are pending', () => {
      expect(timers.getTimerCount()).toBe(0);
    });

    it('counts pending timeouts', () => {
      timers.setTimeout(() => {}, 100);
      timers.setTimeout(() => {}, 200);
      expect(timers.getTimerCount()).toBe(2);
    });

    it('counts pending intervals', () => {
      timers.setInterval(() => {}, 100);
      expect(timers.getTimerCount()).toBe(1);
    });

    it('counts pending rAF callbacks', () => {
      timers.requestAnimationFrame(() => {});
      expect(timers.getTimerCount()).toBe(1);
    });

    it('decrements when timers fire', () => {
      timers.setTimeout(() => {}, 100);
      timers.setTimeout(() => {}, 200);
      expect(timers.getTimerCount()).toBe(2);
      timers.tick(100);
      expect(timers.getTimerCount()).toBe(1);
      timers.tick(100);
      expect(timers.getTimerCount()).toBe(0);
    });

    it('decrements when timers are cleared', () => {
      const id = timers.setTimeout(() => {}, 100);
      expect(timers.getTimerCount()).toBe(1);
      timers.clearTimeout(id);
      expect(timers.getTimerCount()).toBe(0);
    });

    it('interval stays at 1 because it re-schedules', () => {
      timers.setInterval(() => {}, 100);
      timers.tick(100);
      expect(timers.getTimerCount()).toBe(1); // re-scheduled
    });
  });

  describe('now', () => {
    it('starts at 0 in fake mode', () => {
      expect(timers.now()).toBe(0);
    });

    it('advances with tick', () => {
      timers.tick(42);
      expect(timers.now()).toBe(42);
    });

    it('returns Date.now() in real mode', () => {
      timers.useRealTimers();
      const before = Date.now();
      const result = timers.now();
      const after = Date.now();
      expect(result).toBeGreaterThanOrEqual(before);
      expect(result).toBeLessThanOrEqual(after);
    });
  });

  describe('reset', () => {
    it('clears all pending fake timers', () => {
      timers.setTimeout(() => {}, 100);
      timers.setInterval(() => {}, 100);
      timers.requestAnimationFrame(() => {});
      expect(timers.getTimerCount()).toBe(3);
      timers.reset();
      expect(timers.getTimerCount()).toBe(0);
    });

    it('resets fake time to 0', () => {
      timers.tick(500);
      expect(timers.now()).toBe(500);
      timers.reset();
      expect(timers.now()).toBe(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// TimerController — Mode switching
// ═══════════════════════════════════════════════════════════════════════

describe('TimerController — mode switching', () => {
  let timers: TimerController;

  beforeEach(() => {
    timers = new TimerController();
  });

  afterEach(() => {
    timers.reset();
  });

  it('starts in real mode by default', () => {
    // now() should return something close to Date.now()
    const diff = Math.abs(timers.now() - Date.now());
    expect(diff).toBeLessThan(100);
  });

  it('switching to fake mode clears pending fakes from prior session', () => {
    timers.useFakeTimers();
    timers.setTimeout(() => {}, 100);
    expect(timers.getTimerCount()).toBe(1);
    timers.useFakeTimers(); // re-entering fake mode
    expect(timers.getTimerCount()).toBe(0);
  });

  it('switching to real mode clears pending fakes', () => {
    timers.useFakeTimers();
    timers.setTimeout(() => {}, 100);
    timers.setInterval(() => {}, 100);
    expect(timers.getTimerCount()).toBe(2);
    timers.useRealTimers();
    // Pending fakes should be gone; real mode reports real handles
    expect(timers.getTimerCount()).toBe(0);
  });

  it('IDs continue incrementing across mode switches', () => {
    timers.useFakeTimers();
    const id1 = timers.setTimeout(() => {}, 10);
    timers.useRealTimers();
    const id2 = timers.setTimeout(() => {}, 10);
    timers.clearTimeout(id2);
    expect(id2).toBeGreaterThan(id1);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// TimerController — Edge cases & complex scenarios
// ═══════════════════════════════════════════════════════════════════════

describe('TimerController — edge cases', () => {
  let timers: TimerController;

  beforeEach(() => {
    timers = new TimerController();
    timers.useFakeTimers();
  });

  afterEach(() => {
    timers.reset();
  });

  it('timeout + interval interleave correctly', () => {
    const order: string[] = [];
    timers.setInterval(() => order.push('interval'), 100);
    timers.setTimeout(() => order.push('timeout'), 150);

    timers.tick(300);
    // interval: 100, 200, 300
    // timeout: 150
    expect(order).toEqual(['interval', 'timeout', 'interval', 'interval']);
  });

  it('deeply nested setTimeout chain', () => {
    const order: number[] = [];
    timers.setTimeout(() => {
      order.push(1);
      timers.setTimeout(() => {
        order.push(2);
        timers.setTimeout(() => {
          order.push(3);
        }, 10);
      }, 10);
    }, 10);

    timers.tick(10);
    expect(order).toEqual([1]);
    timers.tick(10);
    expect(order).toEqual([1, 2]);
    timers.tick(10);
    expect(order).toEqual([1, 2, 3]);
  });

  it('rAF scheduled inside a setTimeout fires at correct time', () => {
    let rafTs: number | undefined;
    timers.setTimeout(() => {
      timers.requestAnimationFrame((ts) => { rafTs = ts; });
    }, 50);

    timers.tick(50); // setTimeout fires, rAF scheduled for 50+16=66
    expect(rafTs).toBeUndefined();

    timers.tick(16); // now at 66, rAF fires
    expect(rafTs).toBe(66);
  });

  it('clearTimeout inside another timer callback', () => {
    const fn = vi.fn();
    const idToCancel = timers.setTimeout(fn, 200);

    timers.setTimeout(() => {
      timers.clearTimeout(idToCancel);
    }, 100);

    timers.tick(300);
    expect(fn).not.toHaveBeenCalled();
  });

  it('multiple timers at exact same time execute in registration order', () => {
    const order: string[] = [];
    timers.setTimeout(() => order.push('a'), 100);
    timers.setInterval(() => order.push('b'), 100);
    timers.setTimeout(() => order.push('c'), 100);

    timers.tick(100);
    expect(order).toEqual(['a', 'b', 'c']);
  });

  it('timer callback that throws does not break the queue', () => {
    const order: number[] = [];
    timers.setTimeout(() => order.push(1), 10);
    timers.setTimeout(() => { throw new Error('oops'); }, 20);
    timers.setTimeout(() => order.push(3), 30);

    expect(() => timers.tick(10)).not.toThrow();
    expect(order).toEqual([1]);
    expect(() => timers.tick(10)).toThrow('oops');
    // The third timer should still be pending
    expect(timers.getTimerCount()).toBe(1);
    timers.tick(10);
    expect(order).toEqual([1, 3]);
  });

  it('negative delay treated as 0', () => {
    const fn = vi.fn();
    timers.setTimeout(fn, -50);
    timers.tick(0);
    expect(fn).toHaveBeenCalledOnce();
  });
});
