/**
 * 5edd VM Hardening Tests
 *
 * Tests for NaN timeout guard and invalid timeout rejection.
 */
import { describe, it, expect } from 'vitest';

describe('5edd: VM Context — timeout hardening', () => {
  it('rejects NaN timeout and falls back to default 5000ms', async () => {
    const { createVmContext } = await import('./execution/vm-context');
    const ctx = createVmContext({ timeout: NaN });

    expect(() => {
      ctx.executeScript('while(true) {}');
    }).toThrow();
  });

  it('rejects zero timeout and falls back to default', async () => {
    const { createVmContext } = await import('./execution/vm-context');
    const ctx = createVmContext({ timeout: 0 });

    expect(() => {
      ctx.executeScript('while(true) {}');
    }).toThrow();
  });

  it('rejects negative timeout and falls back to default', async () => {
    const { createVmContext } = await import('./execution/vm-context');
    const ctx = createVmContext({ timeout: -100 });

    expect(() => {
      ctx.executeScript('while(true) {}');
    }).toThrow();
  });

  it('rejects Infinity timeout and falls back to default', async () => {
    const { createVmContext } = await import('./execution/vm-context');
    const ctx = createVmContext({ timeout: Infinity });

    expect(() => {
      ctx.executeScript('while(true) {}');
    }).toThrow();
  });
});
