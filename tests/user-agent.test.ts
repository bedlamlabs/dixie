/**
 * Tests for user-agent spoofing — default Chrome UA, --user-agent flag,
 * and UA threading through the render pipeline.
 */
import { describe, it, expect } from 'vitest';
import { Navigator, DEFAULT_USER_AGENT } from '../src/browser/Navigator';
import { createDixieEnvironment } from '../src/environment';
import { createVmContext } from '../src/execution/vm-context';
import { parseArgs } from '../src/cli';

describe('DEFAULT_USER_AGENT', () => {
  it('is a realistic Chrome UA string', () => {
    expect(DEFAULT_USER_AGENT).toContain('Mozilla/5.0');
    expect(DEFAULT_USER_AGENT).toContain('Chrome/');
    expect(DEFAULT_USER_AGENT).toContain('Safari/');
    expect(DEFAULT_USER_AGENT).not.toContain('Dixie');
  });
});

describe('Navigator', () => {
  it('uses Chrome UA by default', () => {
    const nav = new Navigator();
    expect(nav.userAgent).toBe(DEFAULT_USER_AGENT);
  });
});

describe('DixieEnvironment UA', () => {
  it('uses Chrome UA by default', () => {
    const env = createDixieEnvironment();
    expect(env.navigator.userAgent).toBe(DEFAULT_USER_AGENT);
  });

  it('accepts custom userAgent override', () => {
    const env = createDixieEnvironment({ userAgent: 'CustomBot/1.0' });
    expect(env.navigator.userAgent).toBe('CustomBot/1.0');
  });
});

describe('VmContext UA', () => {
  it('passes userAgent to the environment', () => {
    const ctx = createVmContext({ userAgent: 'TestAgent/2.0' });
    expect(ctx.env.navigator.userAgent).toBe('TestAgent/2.0');
  });

  it('uses default Chrome UA when no userAgent specified', () => {
    const ctx = createVmContext();
    expect(ctx.env.navigator.userAgent).toBe(DEFAULT_USER_AGENT);
  });
});

describe('CLI --user-agent flag', () => {
  it('parses --user-agent into args.userAgent', () => {
    const args = parseArgs(['render', 'https://example.com', '--user-agent', 'MyBot/1.0']);
    expect(args.userAgent).toBe('MyBot/1.0');
  });

  it('defaults to undefined when not specified', () => {
    const args = parseArgs(['render', 'https://example.com']);
    expect(args.userAgent).toBeUndefined();
  });
});

describe('VM sandbox has fetch', () => {
  it('wires fetch into the sandbox by default', () => {
    const ctx = createVmContext({ url: 'http://test.local/' });
    expect(ctx.liveFetch).toBeDefined();
    expect(typeof ctx.window.fetch).toBe('function');
  });

  it('does not wire fetch when enableFetch is false', () => {
    const ctx = createVmContext({ url: 'http://test.local/', enableFetch: false });
    expect(ctx.liveFetch).toBeUndefined();
    expect(ctx.window.fetch).toBeUndefined();
  });

  it('sandbox has web platform APIs', () => {
    const ctx = createVmContext({ url: 'http://test.local/' });
    expect(ctx.window.URL).toBe(globalThis.URL);
    expect(ctx.window.AbortController).toBe(globalThis.AbortController);
    expect(ctx.window.TextEncoder).toBe(globalThis.TextEncoder);
    expect(ctx.window.TextDecoder).toBe(globalThis.TextDecoder);
  });
});
