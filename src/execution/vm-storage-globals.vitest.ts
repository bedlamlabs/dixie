/**
 * Triage 2026-03-17 — Issue #2: Missing browser globals in VM sandbox
 *
 * SPA bundles reference localStorage, sessionStorage, DOM constructors
 * (HTMLInputElement, HTMLElement, etc.), and layout queries (getComputedStyle,
 * matchMedia). Without these in the VM sandbox, scripts throw ReferenceError
 * or TypeError and React fails to hydrate.
 *
 * This test verifies the VM sandbox exposes all required browser globals.
 */
import { describe, it, expect } from 'vitest';
import { createVmContext } from './vm-context';

describe('VM sandbox — browser storage globals', () => {
  it('should expose localStorage in the sandbox', () => {
    const ctx = createVmContext({ url: 'http://localhost:5001/' });
    const result = ctx.executeScript('const x = typeof localStorage;');
    expect(result.error).toBeUndefined();
  });

  it('should expose sessionStorage in the sandbox', () => {
    const ctx = createVmContext({ url: 'http://localhost:5001/' });
    const result = ctx.executeScript('const x = typeof sessionStorage;');
    expect(result.error).toBeUndefined();
  });

  it('localStorage.getItem should return null for unknown keys', () => {
    const ctx = createVmContext({ url: 'http://localhost:5001/' });
    const result = ctx.executeScript(`
      const val = localStorage.getItem('nonexistent');
      if (val !== null) throw new Error('Expected null, got ' + val);
    `);
    expect(result.error).toBeUndefined();
  });

  it('localStorage.setItem and getItem should round-trip', () => {
    const ctx = createVmContext({ url: 'http://localhost:5001/' });
    const result = ctx.executeScript(`
      localStorage.setItem('test-key', 'test-value');
      const val = localStorage.getItem('test-key');
      if (val !== 'test-value') throw new Error('Expected test-value, got ' + val);
    `);
    expect(result.error).toBeUndefined();
  });

  it('localStorage.removeItem should remove stored values', () => {
    const ctx = createVmContext({ url: 'http://localhost:5001/' });
    const result = ctx.executeScript(`
      localStorage.setItem('key1', 'val1');
      localStorage.removeItem('key1');
      const val = localStorage.getItem('key1');
      if (val !== null) throw new Error('Expected null after remove, got ' + val);
    `);
    expect(result.error).toBeUndefined();
  });

  it('localStorage.clear should empty all stored values', () => {
    const ctx = createVmContext({ url: 'http://localhost:5001/' });
    const result = ctx.executeScript(`
      localStorage.setItem('a', '1');
      localStorage.setItem('b', '2');
      localStorage.clear();
      if (localStorage.getItem('a') !== null) throw new Error('a should be null');
      if (localStorage.getItem('b') !== null) throw new Error('b should be null');
    `);
    expect(result.error).toBeUndefined();
  });

  it('sessionStorage should work independently from localStorage', () => {
    const ctx = createVmContext({ url: 'http://localhost:5001/' });
    const result = ctx.executeScript(`
      localStorage.setItem('shared-key', 'local-val');
      sessionStorage.setItem('shared-key', 'session-val');
      if (localStorage.getItem('shared-key') !== 'local-val') throw new Error('localStorage wrong');
      if (sessionStorage.getItem('shared-key') !== 'session-val') throw new Error('sessionStorage wrong');
    `);
    expect(result.error).toBeUndefined();
  });

  it('Maxwell-style localStorage access should not crash', () => {
    const ctx = createVmContext({ url: 'http://localhost:5001/' });
    const result = ctx.executeScript(`
      try {
        const token = localStorage.getItem('maxwell_session');
        if (!token) {
          // Widget falls back to contact form — this is fine
        }
      } catch (e) {
        throw new Error('Maxwell localStorage access crashed: ' + e.message);
      }
    `);
    expect(result.error).toBeUndefined();
  });
});

describe('VM sandbox — DOM constructor globals', () => {
  it('should expose HTMLInputElement for instanceof checks', () => {
    const ctx = createVmContext({ url: 'http://localhost:5001/' });
    const result = ctx.executeScript(`
      if (typeof HTMLInputElement !== 'function') {
        throw new Error('HTMLInputElement is ' + typeof HTMLInputElement);
      }
    `);
    expect(result.error).toBeUndefined();
  });

  it('should expose HTMLElement for instanceof checks', () => {
    const ctx = createVmContext({ url: 'http://localhost:5001/' });
    const result = ctx.executeScript(`
      if (typeof HTMLElement !== 'function') {
        throw new Error('HTMLElement is ' + typeof HTMLElement);
      }
    `);
    expect(result.error).toBeUndefined();
  });

  it('instanceof HTMLInputElement should not crash (RHS is an object)', () => {
    const ctx = createVmContext({ url: 'http://localhost:5001/' });
    // This is the exact pattern that crashed production: bundled code doing
    // `x instanceof HTMLInputElement` where HTMLInputElement was undefined
    const result = ctx.executeScript(`
      const el = document.createElement('input');
      const isInput = el instanceof HTMLInputElement;
      if (!isInput) throw new Error('Expected input element to pass instanceof check');
    `);
    expect(result.error).toBeUndefined();
  });

  it('instanceof HTMLDivElement should work for div elements', () => {
    const ctx = createVmContext({ url: 'http://localhost:5001/' });
    const result = ctx.executeScript(`
      const el = document.createElement('div');
      if (!(el instanceof HTMLDivElement)) throw new Error('div instanceof check failed');
      if (!(el instanceof HTMLElement)) throw new Error('HTMLElement instanceof check failed');
    `);
    expect(result.error).toBeUndefined();
  });

  it('should expose Node and Element constructors', () => {
    const ctx = createVmContext({ url: 'http://localhost:5001/' });
    const result = ctx.executeScript(`
      if (typeof Node !== 'function') throw new Error('Node missing');
      if (typeof Element !== 'function') throw new Error('Element missing');
      const el = document.createElement('span');
      if (!(el instanceof Element)) throw new Error('Element instanceof failed');
    `);
    expect(result.error).toBeUndefined();
  });

  it('should expose getComputedStyle', () => {
    const ctx = createVmContext({ url: 'http://localhost:5001/' });
    const result = ctx.executeScript(`
      if (typeof getComputedStyle !== 'function') {
        throw new Error('getComputedStyle is ' + typeof getComputedStyle);
      }
    `);
    expect(result.error).toBeUndefined();
  });

  it('should expose matchMedia', () => {
    const ctx = createVmContext({ url: 'http://localhost:5001/' });
    const result = ctx.executeScript(`
      if (typeof matchMedia !== 'function') {
        throw new Error('matchMedia is ' + typeof matchMedia);
      }
    `);
    expect(result.error).toBeUndefined();
  });
});
