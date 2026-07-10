import { describe, it, expect } from 'vitest';
import { TimerController } from './Timers';
import { createDixieEnvironment } from '../environment';
import { createVmContext } from '../execution/vm-context';
import { renderUrl } from '../cli/commands/render';

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

describe('TimerController.dispose()', () => {
  it('clears all live real-mode handles (timeouts, intervals, rAF)', () => {
    const timers = new TimerController();
    timers.setTimeout(() => {}, 60_000);
    timers.setInterval(() => {}, 60_000);
    timers.requestAnimationFrame(() => {});
    expect(timers.getTimerCount()).toBe(3);

    timers.dispose();
    expect(timers.getTimerCount()).toBe(0);
  });

  it('disposed timers never fire', async () => {
    const timers = new TimerController();
    let fired = false;
    timers.setTimeout(() => { fired = true; }, 5);
    timers.setInterval(() => { fired = true; }, 5);
    timers.dispose();

    await sleep(30);
    expect(fired).toBe(false);
  });

  it('scheduling after dispose is a no-op (no new live handles)', async () => {
    const timers = new TimerController();
    timers.dispose();

    let fired = false;
    timers.setTimeout(() => { fired = true; }, 5);
    timers.setInterval(() => { fired = true; }, 5);
    timers.requestAnimationFrame(() => { fired = true; });

    expect(timers.getTimerCount()).toBe(0);
    await sleep(30);
    expect(fired).toBe(false);
  });

  it('clearTimeout accepts the TimerHandle object returned by setTimeout (real mode)', () => {
    const timers = new TimerController();
    const handle = timers.setTimeout(() => {}, 60_000);
    expect(timers.getTimerCount()).toBe(1);

    // Pass the handle object itself, not a coerced number
    timers.clearTimeout(handle);
    expect(timers.getTimerCount()).toBe(0);
    timers.dispose();
  });
});

describe('Window timers are tracked by the environment TimerController', () => {
  it('window.setInterval registers on env.timers so dispose can clear it', () => {
    const env = createDixieEnvironment({ url: 'http://localhost/' });
    const before = env.timers.getTimerCount();
    (env.window as any).setInterval(() => {}, 60_000);
    (env.window as any).setTimeout(() => {}, 60_000);
    expect(env.timers.getTimerCount()).toBe(before + 2);

    env.timers.dispose();
    expect(env.timers.getTimerCount()).toBe(0);
    env.destroy();
  });

  it('window.clearInterval clears the tracked handle', () => {
    const env = createDixieEnvironment({ url: 'http://localhost/' });
    const id = (env.window as any).setInterval(() => {}, 60_000);
    expect(env.timers.getTimerCount()).toBe(1);
    (env.window as any).clearInterval(id);
    expect(env.timers.getTimerCount()).toBe(0);
    env.destroy();
  });
});

describe('VmContext timer dispose', () => {
  it('page-scheduled intervals are tracked and cleared by ctx.dispose()', () => {
    const ctx = createVmContext({ url: 'http://localhost/', enableFetch: false });
    ctx.executeScript(`
      setInterval(function () {}, 60000);
      setTimeout(function () {}, 60000);
      requestAnimationFrame(function () {});
    `);
    expect(ctx.env.timers.getTimerCount()).toBeGreaterThan(0);

    ctx.dispose();
    expect(ctx.env.timers.getTimerCount()).toBe(0);
  });
});

describe('renderUrl timer dispose', () => {
  it('a page interval does not keep live handles after dispose()', async () => {
    const page =
      'data:text/html,' +
      encodeURIComponent(
        '<html><body><h1>Static</h1><script>' +
          'setInterval(function () {}, 60000);' +
          '</script></body></html>',
      );

    const result = await renderUrl(page, { timeout: 5000 });
    // The page script registered a long-lived interval
    expect(result.context.env.timers.getTimerCount()).toBeGreaterThan(0);

    result.dispose();
    expect(result.context.env.timers.getTimerCount()).toBe(0);
  });
});
