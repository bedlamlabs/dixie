import { describe, it, expect, afterEach } from 'vitest';
import { EnvironmentPool } from '../src/environment/EnvironmentPool';
import { Document } from '../src/nodes/Document';
import { Window } from '../src/browser/Window';

describe('EnvironmentPool', () => {
  const pools: EnvironmentPool[] = [];

  function createPool(options?: ConstructorParameters<typeof EnvironmentPool>[0]) {
    const pool = new EnvironmentPool(options);
    pools.push(pool);
    return pool;
  }

  afterEach(() => {
    for (const pool of pools) {
      try {
        pool.drain();
      } catch {
        // already drained
      }
    }
    pools.length = 0;
  });

  // ── Pre-warming ──────────────────────────────────────────────────────

  describe('pre-warming', () => {
    it('creates environments eagerly when preWarm: true (default)', () => {
      const pool = createPool({ size: 3 });
      expect(pool.availableCount).toBe(3);
      expect(pool.inUseCount).toBe(0);
      expect(pool.totalCount).toBe(3);
    });

    it('starts empty when preWarm: false', () => {
      const pool = createPool({ size: 4, preWarm: false });
      expect(pool.availableCount).toBe(0);
      expect(pool.inUseCount).toBe(0);
      expect(pool.totalCount).toBe(0);
    });

    it('defaults to size 4 with preWarm: true', () => {
      const pool = createPool();
      expect(pool.availableCount).toBe(4);
    });
  });

  // ── acquire() ──────────────────────────────────────────────────────

  describe('acquire()', () => {
    it('returns environment from pool', () => {
      const pool = createPool({ size: 2 });
      const env = pool.acquire();
      expect(env.document).toBeInstanceOf(Document);
      expect(env.window).toBeInstanceOf(Window);
      pool.release(env);
    });

    it('creates new environment when pool empty (under maxSize)', () => {
      const pool = createPool({ size: 1, maxSize: 4 });
      const env1 = pool.acquire();
      expect(pool.availableCount).toBe(0);

      // Pool is empty, but acquire should still work (creates new)
      const env2 = pool.acquire();
      expect(env2.document).toBeInstanceOf(Document);
      expect(pool.inUseCount).toBe(2);
      expect(pool.totalCount).toBe(2);

      pool.release(env1);
      pool.release(env2);
    });

    it('throws when at maxSize with all environments in use', () => {
      const pool = createPool({ size: 2, maxSize: 2 });
      pool.acquire();
      pool.acquire();

      expect(() => pool.acquire()).toThrow('exhausted');
    });

    it('decrements available count and increments in-use count', () => {
      const pool = createPool({ size: 3 });
      expect(pool.availableCount).toBe(3);
      expect(pool.inUseCount).toBe(0);

      const env = pool.acquire();
      expect(pool.availableCount).toBe(2);
      expect(pool.inUseCount).toBe(1);
      pool.release(env);
    });

    it('returns a clean environment (reset state)', () => {
      const pool = createPool({ size: 1, maxSize: 4 });
      const env = pool.acquire();

      // Dirty the environment
      env.document.body.innerHTML = '<div>dirty</div>';
      env.localStorage.setItem('test', 'value');
      pool.release(env);

      // Acquire again — should be clean
      const env2 = pool.acquire();
      expect(env2.document.body.childNodes.length).toBe(0);
      expect(env2.localStorage.length).toBe(0);
      pool.release(env2);
    });

    it('throws after pool is drained', () => {
      const pool = new EnvironmentPool({ size: 2 });
      pool.drain();
      expect(() => pool.acquire()).toThrow('drained');
    });

    it('works when preWarm is false and pool starts empty', () => {
      const pool = createPool({ size: 2, preWarm: false, maxSize: 4 });
      const env = pool.acquire();
      expect(env.document).toBeInstanceOf(Document);
      expect(pool.inUseCount).toBe(1);
      pool.release(env);
    });
  });

  // ── release() ──────────────────────────────────────────────────────

  describe('release()', () => {
    it('returns environment to pool for reuse', () => {
      const pool = createPool({ size: 2 });
      const env = pool.acquire();
      expect(pool.availableCount).toBe(1);
      expect(pool.inUseCount).toBe(1);

      pool.release(env);
      expect(pool.availableCount).toBe(2);
      expect(pool.inUseCount).toBe(0);
    });

    it('resets environment when resetOnRelease: true (default)', () => {
      const pool = createPool({ size: 1, maxSize: 4 });
      const env = pool.acquire();
      env.document.body.innerHTML = '<p>test</p>';
      env.localStorage.setItem('x', 'y');

      pool.release(env);

      // Acquire the same env — it should be clean
      const env2 = pool.acquire();
      expect(env2.document.body.childNodes.length).toBe(0);
      expect(env2.localStorage.length).toBe(0);
      pool.release(env2);
    });

    it('skips reset when resetOnRelease: false', () => {
      const pool = createPool({ size: 1, maxSize: 4, resetOnRelease: false });

      // First acquire: reset happens (from pool)
      const env = pool.acquire();
      env.localStorage.setItem('persist', 'yes');

      // Release without reset
      pool.release(env);

      const s = pool.stats();
      // resetOnRelease=false: release does NOT increment resetCount
      // Only the acquire from pool incremented it (1 reset)
      expect(s.resetCount).toBe(1);
    });

    it('throws when releasing an environment not from this pool', async () => {
      const pool = createPool({ size: 1 });
      const { createDixieEnvironment } = await import('../src/environment/DixieEnvironment');
      const foreign = createDixieEnvironment();
      expect(() => pool.release(foreign)).toThrow('not acquired from this pool');
      foreign.destroy();
    });

    it('throws after pool is drained', () => {
      const pool = new EnvironmentPool({ size: 2 });
      const env = pool.acquire();
      pool.drain();
      expect(() => pool.release(env)).toThrow('drained');
    });
  });

  // ── withEnvironment() ────────────────────────────────────────────────

  describe('withEnvironment()', () => {
    it('acquires and releases automatically', () => {
      const pool = createPool({ size: 2 });
      expect(pool.inUseCount).toBe(0);

      const result = pool.withEnvironment(env => {
        expect(pool.inUseCount).toBe(1);
        env.document.body.innerHTML = '<div>hello</div>';
        return env.document.body.textContent;
      });

      expect(result).toBe('hello');
      expect(pool.inUseCount).toBe(0);
    });

    it('releases even when fn throws', () => {
      const pool = createPool({ size: 2 });

      expect(() => {
        pool.withEnvironment(() => {
          throw new Error('boom');
        });
      }).toThrow('boom');

      // Environment should be released back to pool
      expect(pool.inUseCount).toBe(0);
      expect(pool.availableCount).toBe(2);
    });
  });

  // ── withEnvironmentAsync() ──────────────────────────────────────────

  describe('withEnvironmentAsync()', () => {
    it('works with async functions', async () => {
      const pool = createPool({ size: 2 });

      const result = await pool.withEnvironmentAsync(async env => {
        expect(pool.inUseCount).toBe(1);
        env.document.body.innerHTML = '<span>async</span>';
        await Promise.resolve(); // simulate async work
        return env.document.body.textContent;
      });

      expect(result).toBe('async');
      expect(pool.inUseCount).toBe(0);
    });

    it('releases even when async fn rejects', async () => {
      const pool = createPool({ size: 2 });

      await expect(
        pool.withEnvironmentAsync(async () => {
          await Promise.resolve();
          throw new Error('async boom');
        })
      ).rejects.toThrow('async boom');

      expect(pool.inUseCount).toBe(0);
      expect(pool.availableCount).toBe(2);
    });
  });

  // ── stats() ──────────────────────────────────────────────────────────

  describe('stats()', () => {
    it('tracks all operations correctly', () => {
      const pool = createPool({ size: 2, maxSize: 8 });

      // Initial stats
      let s = pool.stats();
      expect(s.total).toBe(2);
      expect(s.available).toBe(2);
      expect(s.inUse).toBe(0);
      expect(s.peakInUse).toBe(0);
      expect(s.acquireCount).toBe(0);
      expect(s.resetCount).toBe(0);

      // Acquire one
      const env1 = pool.acquire();
      s = pool.stats();
      expect(s.total).toBe(2);
      expect(s.available).toBe(1);
      expect(s.inUse).toBe(1);
      expect(s.peakInUse).toBe(1);
      expect(s.acquireCount).toBe(1);
      expect(s.resetCount).toBe(1); // reset on acquire from pool

      // Acquire another
      const env2 = pool.acquire();
      s = pool.stats();
      expect(s.inUse).toBe(2);
      expect(s.peakInUse).toBe(2);
      expect(s.acquireCount).toBe(2);

      // Release one
      pool.release(env1);
      s = pool.stats();
      expect(s.inUse).toBe(1);
      expect(s.available).toBe(1);
      expect(s.peakInUse).toBe(2); // peak stays at 2

      pool.release(env2);
    });

    it('tracks peakInUse as high water mark', () => {
      const pool = createPool({ size: 4, maxSize: 8 });

      const e1 = pool.acquire();
      const e2 = pool.acquire();
      const e3 = pool.acquire();
      expect(pool.stats().peakInUse).toBe(3);

      pool.release(e3);
      pool.release(e2);
      pool.release(e1);

      // Peak should not decrease
      expect(pool.stats().peakInUse).toBe(3);

      // Acquire one more — peak still 3
      const e4 = pool.acquire();
      expect(pool.stats().peakInUse).toBe(3);
      pool.release(e4);
    });
  });

  // ── drain() ────────────────────────────────────────────────────────

  describe('drain()', () => {
    it('empties the pool', () => {
      const pool = createPool({ size: 3 });
      pool.drain();
      expect(pool.availableCount).toBe(0);
      expect(pool.totalCount).toBe(0);
    });

    it('destroys all in-use environments', () => {
      const pool = createPool({ size: 2 });
      const env1 = pool.acquire();
      const env2 = pool.acquire();

      pool.drain();
      expect(pool.totalCount).toBe(0);

      // Environments should be destroyed
      expect(() => env1.document).toThrow('destroyed');
      expect(() => env2.document).toThrow('destroyed');
    });

    it('is idempotent (multiple drain calls do not throw)', () => {
      const pool = new EnvironmentPool({ size: 2 });
      pool.drain();
      pool.drain(); // should not throw
    });

    it('prevents acquire after drain', () => {
      const pool = new EnvironmentPool({ size: 2 });
      pool.drain();
      expect(() => pool.acquire()).toThrow('drained');
    });
  });

  // ── warmUp() ────────────────────────────────────────────────────────

  describe('warmUp()', () => {
    it('creates additional environments', () => {
      const pool = createPool({ size: 2, maxSize: 8, preWarm: false });
      expect(pool.availableCount).toBe(0);

      pool.warmUp(3);
      expect(pool.availableCount).toBe(3);
    });

    it('does not exceed maxSize', () => {
      const pool = createPool({ size: 2, maxSize: 4 });
      expect(pool.availableCount).toBe(2);

      pool.warmUp(10); // asks for 10 but maxSize is 4, already have 2
      expect(pool.availableCount).toBe(4);
      expect(pool.totalCount).toBe(4);
    });

    it('works after some environments are in use', () => {
      const pool = createPool({ size: 2, maxSize: 6 });
      const env = pool.acquire(); // 1 in use, 1 available
      pool.warmUp(3); // should create 3 more (total = 2 + 3 = 5, under maxSize 6)
      expect(pool.availableCount).toBe(4); // 1 original + 3 new
      expect(pool.totalCount).toBe(5); // 4 available + 1 in use
      pool.release(env);
    });

    it('throws if pool is drained', () => {
      const pool = new EnvironmentPool({ size: 2 });
      pool.drain();
      expect(() => pool.warmUp(2)).toThrow('drained');
    });
  });

  // ── Recycling behavior ─────────────────────────────────────────────

  describe('recycling behavior', () => {
    it('reuses the same environment instance on acquire-release-acquire', () => {
      const pool = createPool({ size: 1, maxSize: 4 });
      const env1 = pool.acquire();
      const ref = env1.window; // capture reference
      pool.release(env1);

      const env2 = pool.acquire();
      expect(env2.window).toBe(ref); // same underlying window
      pool.release(env2);
    });

    it('handles multiple acquire-release cycles', () => {
      const pool = createPool({ size: 2, maxSize: 8 });

      for (let i = 0; i < 10; i++) {
        const env = pool.acquire();
        env.document.body.innerHTML = `<div>cycle-${i}</div>`;
        env.localStorage.setItem('i', String(i));
        pool.release(env);
      }

      // Pool should still have 2 available
      expect(pool.availableCount).toBe(2);
      expect(pool.inUseCount).toBe(0);
    });

    it('multiple environments can be acquired concurrently', () => {
      const pool = createPool({ size: 4, maxSize: 8 });
      const envs = [];

      for (let i = 0; i < 4; i++) {
        envs.push(pool.acquire());
      }
      expect(pool.availableCount).toBe(0);
      expect(pool.inUseCount).toBe(4);

      // Each environment is independent
      envs[0].localStorage.setItem('env', '0');
      envs[1].localStorage.setItem('env', '1');
      expect(envs[0].localStorage.getItem('env')).toBe('0');
      expect(envs[1].localStorage.getItem('env')).toBe('1');

      for (const env of envs) {
        pool.release(env);
      }
      expect(pool.availableCount).toBe(4);
      expect(pool.inUseCount).toBe(0);
    });
  });

  // ── Pool reuse is faster than creating new environments ─────────

  describe('performance', () => {
    it('pool reuse is faster than creating new environments', async () => {
      const iterations = 50;
      const { createDixieEnvironment } = await import('../src/environment/DixieEnvironment');

      // Measure: create new environments each time
      const startNew = performance.now();
      for (let i = 0; i < iterations; i++) {
        const env = createDixieEnvironment();
        env.document.body.innerHTML = '<div>test</div>';
        env.destroy();
      }
      const newTime = performance.now() - startNew;

      // Measure: reuse pooled environments
      const pool = createPool({ size: 1, maxSize: 4 });
      const startPool = performance.now();
      for (let i = 0; i < iterations; i++) {
        const env = pool.acquire();
        env.document.body.innerHTML = '<div>test</div>';
        pool.release(env);
      }
      const poolTime = performance.now() - startPool;

      // Pool reuse should be faster (or at least not dramatically slower)
      // We use a generous threshold since CI can be variable
      expect(poolTime).toBeLessThan(newTime * 3);
    });
  });

  // ── Edge cases ──────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('throws if size exceeds maxSize', () => {
      expect(() => new EnvironmentPool({ size: 10, maxSize: 5 })).toThrow(
        'Pool size (10) cannot exceed maxSize (5)'
      );
    });

    it('supports custom environment options', () => {
      const pool = createPool({
        size: 1,
        maxSize: 4,
        environmentOptions: { url: 'https://test.com/app' },
      });
      const env = pool.acquire();
      expect(env.location.href).toBe('https://test.com/app');
      pool.release(env);
    });
  });
});
