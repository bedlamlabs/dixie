/**
 * 508f.config.test.ts — Config-Driven Adapter Pattern
 *
 * AC 9: dixie.config.ts is the only place app-specific config lives
 * Edge Case 3: Config file missing — Dixie still works with defaults
 *
 * Tests go in dixie-standalone/tests/ during /do
 */
import { describe, it, expect } from 'vitest';

// ── AC 9: Config interface ─────────────────────────────────────────
describe('dixie.config.ts adapter pattern', () => {
  it('DixieConfig type includes auth strategy with acquire function', async () => {
    const { resolveConfig } = await import('../src/cli/config-loader');

    const config = await resolveConfig({ configPath: undefined });

    // v4: auth strategy must include acquire() function
    expect(config.auth).toHaveProperty('acquire');
    expect(typeof config.auth.acquire).toBe('function');
  });

  it('resolveConfig returns a valid config object', async () => {
    const { resolveConfig } = await import('../src/cli/config-loader');

    const config = await resolveConfig({ configPath: undefined });

    expect(typeof config).toBe('object');
    expect(config).toHaveProperty('baseUrl');
  });

  it('config includes auth strategy', async () => {
    const { resolveConfig } = await import('../src/cli/config-loader');

    const config = await resolveConfig({ configPath: undefined });

    expect(config).toHaveProperty('auth');
    expect(config.auth).toHaveProperty('type');
    // Default auth type should be 'none' when no config file
    expect(['none', 'cookie', 'bearer']).toContain(config.auth.type);
  });

  it('config includes routes array', async () => {
    const { resolveConfig } = await import('../src/cli/config-loader');

    const config = await resolveConfig({ configPath: undefined });

    expect(config).toHaveProperty('routes');
    expect(Array.isArray(config.routes)).toBe(true);
  });

  it('config includes appEntry field', async () => {
    const { resolveConfig } = await import('../src/cli/config-loader');

    const config = await resolveConfig({ configPath: undefined });

    expect(config).toHaveProperty('appEntry');
    // When no config file, appEntry can be empty string or undefined
    expect(typeof config.appEntry === 'string' || config.appEntry === undefined).toBe(true);
  });
});

// ── Edge Case 3: Missing config file ───────────────────────────────
describe('missing config file', () => {
  it('resolveConfig works without a dixie.config.ts file', async () => {
    const { resolveConfig } = await import('../src/cli/config-loader');

    // Explicitly pass a non-existent config path
    const config = await resolveConfig({ configPath: '/nonexistent/dixie.config.ts' });

    // Must return defaults, not throw
    expect(typeof config).toBe('object');
    expect(config.auth.type).toBe('none');
    expect(config.routes).toEqual([]);
  });

  it('render command works without config for raw HTML', async () => {
    const { renderUrl } = await import('../src/cli/commands/render');

    // Rendering a basic URL with no config should still work
    // (uses defaults — no auth, no app entry, raw HTML mode)
    const result = await renderUrl('http://example.local/', {
      config: {
        baseUrl: 'http://example.local',
        appEntry: '',
        routes: [],
        auth: { type: 'none' as const },
      },
    });

    expect(result).toHaveProperty('document');
    expect(result).toHaveProperty('meta');
  });
});

// ── No hardcoded ThriveOS refs in core ─────────────────────────────
describe('ThriveOS decoupling', () => {
  it('TokenAcquisition accepts auth strategy from config', async () => {
    const { TokenAcquisition } = await import('../src/auth/TokenAcquisition');

    // Must accept config-driven auth strategy, not hardcoded login
    const tokenAcq = new TokenAcquisition({
      type: 'bearer',
      acquire: async () => 'test-token-123',
    });

    expect(tokenAcq).toBeInstanceOf(Object);
    const token = await tokenAcq.acquire();
    expect(token).toBe('test-token-123');
  });

  it('init command scaffolds dixie.config.ts template', async () => {
    const mod = await import('../src/cli/commands/init');

    const result = await mod.execute({
      command: 'init',
      _: [],
      format: 'json',
      dryRun: true, // don't actually write files
    });

    expect(result.exitCode).toBe(0);
    // Init should indicate it would create a config file
    expect(typeof (result.data?.files ?? result.data?.config)).toBe('object');
  });
});
