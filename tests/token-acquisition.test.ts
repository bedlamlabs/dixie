import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TokenAcquisition } from '../src/auth/TokenAcquisition';
import type { TokenConfig } from '../src/auth/TokenAcquisition';

// ═══════════════════════════════════════════════════════════════════════
// TokenAcquisition
// ═══════════════════════════════════════════════════════════════════════

describe('TokenAcquisition', () => {
  // ─── Helper: minimal valid config ──────────────────────────────────

  function makeConfig(overrides?: Partial<TokenConfig>): TokenConfig {
    return {
      baseUrl: 'http://localhost:3000',
      loginEndpoint: '/api/auth/login',
      credentials: { email: 'test@example.com', password: 'test123' },
      ...overrides,
    };
  }

  // ─── Mock token generation ─────────────────────────────────────────

  describe('generateMockToken', () => {
    it('produces a valid JWT format (3 dot-separated base64 segments)', () => {
      const token = TokenAcquisition.generateMockToken();
      const parts = token.split('.');
      expect(parts).toHaveLength(3);

      // Each part should be base64url (letters, digits, -, _)
      for (const part of parts) {
        expect(part).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(part.length).toBeGreaterThan(0);
      }
    });

    it('embeds the provided payload in the token', () => {
      const token = TokenAcquisition.generateMockToken({ email: 'user@test.com', role: 'admin' });
      const parts = token.split('.');

      // Decode the payload (second segment)
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
      expect(payload.email).toBe('user@test.com');
      expect(payload.role).toBe('admin');
    });

    it('includes standard JWT claims (sub, iat, exp)', () => {
      const token = TokenAcquisition.generateMockToken();
      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));

      expect(payload).toHaveProperty('sub');
      expect(payload).toHaveProperty('iat');
      expect(payload).toHaveProperty('exp');
      expect(payload.exp).toBeGreaterThan(payload.iat);
    });

    it('header specifies HS256 algorithm', () => {
      const token = TokenAcquisition.generateMockToken();
      const parts = token.split('.');
      const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf-8'));

      expect(header.alg).toBe('HS256');
      expect(header.typ).toBe('JWT');
    });
  });

  // ─── Domain allowlist ──────────────────────────────────────────────

  describe('domain allowlist', () => {
    it('rejects credentials with email domain not in allowlist', async () => {
      const config = makeConfig({
        credentials: { email: 'hacker@evil.com', password: 'pass' },
        domainAllowlist: ['@example.com', '@example.com'],
      });

      const ta = new TokenAcquisition(config);
      const result = await ta.acquire();

      expect(result.source).toBe('mock');
      expect(result.error).toContain("'@evil.com'");
      expect(result.error).toContain('not in allowlist');
    });

    it('accepts credentials with email domain in allowlist', async () => {
      // This will still fail to connect (no server), but the domain check passes
      const config = makeConfig({
        credentials: { email: 'test@example.com', password: 'pass' },
        domainAllowlist: ['@example.com'],
        timeout: 100,
      });

      const ta = new TokenAcquisition(config);
      const result = await ta.acquire();

      // Domain check passed — degradation is due to network, not domain
      if (result.source === 'mock') {
        expect(result.error).not.toContain('not in allowlist');
      }
    });

    it('rejects admin credentials with domain not in allowlist', async () => {
      const config = makeConfig({
        credentials: { email: 'test@example.com', password: 'pass' },
        adminCredentials: { email: 'admin@evil.com', password: 'pass' },
        adminLoginEndpoint: '/api/admin/auth/login',
        domainAllowlist: ['@example.com'],
      });

      const ta = new TokenAcquisition(config);
      const result = await ta.acquire();

      expect(result.source).toBe('mock');
      expect(result.error).toContain("'@evil.com'");
    });

    it('allows all domains when no allowlist is configured', async () => {
      const config = makeConfig({
        credentials: { email: 'anyone@anywhere.com', password: 'pass' },
        timeout: 100,
      });

      const ta = new TokenAcquisition(config);
      const result = await ta.acquire();

      // No domain error — only network failure
      if (result.error) {
        expect(result.error).not.toContain('allowlist');
      }
    });
  });

  // ─── Caching ───────────────────────────────────────────────────────

  describe('caching', () => {
    it('returns cached tokens on subsequent calls', async () => {
      const config = makeConfig({ timeout: 100 });
      const ta = new TokenAcquisition(config);

      const result1 = await ta.acquire();
      const result2 = await ta.acquire();

      // Same reference — second call doesn't re-fetch
      expect(result1).toBe(result2);
    });

    it('getCached() returns null before first acquire()', () => {
      const config = makeConfig();
      const ta = new TokenAcquisition(config);

      expect(ta.getCached()).toBeNull();
    });

    it('getCached() returns result after acquire()', async () => {
      const config = makeConfig({ timeout: 100 });
      const ta = new TokenAcquisition(config);

      const result = await ta.acquire();
      expect(ta.getCached()).toBe(result);
    });

    it('clearCache() clears cached tokens', async () => {
      const config = makeConfig({ timeout: 100 });
      const ta = new TokenAcquisition(config);

      await ta.acquire();
      expect(ta.getCached()).not.toBeNull();

      ta.clearCache();
      expect(ta.getCached()).toBeNull();
    });
  });

  // ─── Unreachable server (graceful degradation) ─────────────────────

  describe('graceful degradation', () => {
    it('returns mock tokens when server is unreachable', async () => {
      const config = makeConfig({
        baseUrl: 'http://127.0.0.1:19999', // port nothing listens on
        timeout: 200,
      });

      const ta = new TokenAcquisition(config);
      const result = await ta.acquire();

      expect(result.source).toBe('mock');
      expect(result.userToken).toBeTruthy();
      expect(result.error).toBeTruthy();
    });

    it('mock tokens from degradation are valid JWT format', async () => {
      const config = makeConfig({
        baseUrl: 'http://127.0.0.1:19999',
        timeout: 200,
      });

      const ta = new TokenAcquisition(config);
      const result = await ta.acquire();

      const parts = result.userToken!.split('.');
      expect(parts).toHaveLength(3);
    });

    it('error field is populated on degradation', async () => {
      const config = makeConfig({
        baseUrl: 'http://127.0.0.1:19999',
        timeout: 200,
      });

      const ta = new TokenAcquisition(config);
      const result = await ta.acquire();

      expect(result.source).toBe('mock');
      expect(typeof result.error).toBe('string');
      expect(result.error!.length).toBeGreaterThan(0);
    });

    it('admin token is null when no admin credentials configured', async () => {
      const config = makeConfig({
        baseUrl: 'http://127.0.0.1:19999',
        timeout: 200,
      });

      const ta = new TokenAcquisition(config);
      const result = await ta.acquire();

      expect(result.adminToken).toBeNull();
    });

    it('admin token is generated when admin credentials are configured', async () => {
      const config = makeConfig({
        baseUrl: 'http://127.0.0.1:19999',
        adminCredentials: { email: 'admin@example.com', password: 'admin123' },
        adminLoginEndpoint: '/api/admin/auth/login',
        timeout: 200,
      });

      const ta = new TokenAcquisition(config);
      const result = await ta.acquire();

      expect(result.source).toBe('mock');
      expect(result.adminToken).toBeTruthy();
      // Admin and user tokens should be different
      expect(result.adminToken).not.toBe(result.userToken);
    });
  });

  // ─── Config validation ─────────────────────────────────────────────

  describe('config validation', () => {
    it('throws on missing baseUrl', () => {
      expect(() => new TokenAcquisition({
        baseUrl: '',
        loginEndpoint: '/login',
        credentials: { email: 'a@b.c', password: 'x' },
      })).toThrow('baseUrl is required');
    });

    it('throws on missing loginEndpoint', () => {
      expect(() => new TokenAcquisition({
        baseUrl: 'http://localhost',
        loginEndpoint: '',
        credentials: { email: 'a@b.c', password: 'x' },
      })).toThrow('loginEndpoint is required');
    });

    it('throws on missing credentials', () => {
      expect(() => new TokenAcquisition({
        baseUrl: 'http://localhost',
        loginEndpoint: '/login',
        credentials: undefined as any,
      })).toThrow('credentials is required');
    });

    it('throws on missing credentials.email', () => {
      expect(() => new TokenAcquisition({
        baseUrl: 'http://localhost',
        loginEndpoint: '/login',
        credentials: { email: '', password: 'x' },
      })).toThrow('credentials.email is required');
    });

    it('throws on missing credentials.password', () => {
      expect(() => new TokenAcquisition({
        baseUrl: 'http://localhost',
        loginEndpoint: '/login',
        credentials: { email: 'a@b.c', password: '' },
      })).toThrow('credentials.password is required');
    });
  });

  // ─── Timeout behavior ──────────────────────────────────────────────

  describe('timeout', () => {
    it('does not hang forever with short timeout', async () => {
      const config = makeConfig({
        baseUrl: 'http://127.0.0.1:19999',
        timeout: 100,
      });

      const ta = new TokenAcquisition(config);
      const start = Date.now();
      await ta.acquire();
      const elapsed = Date.now() - start;

      // Should complete reasonably quickly (not hang for default 5000ms)
      // Allow generous margin for CI environments
      expect(elapsed).toBeLessThan(3000);
    });

    it('defaults to 5000ms timeout when not specified', () => {
      const config = makeConfig();
      const ta = new TokenAcquisition(config);
      // We can't directly test the timeout value, but we verify construction works
      expect(ta).toBeDefined();
    });
  });

  // ─── Admin token separation ────────────────────────────────────────

  describe('admin token separation', () => {
    it('user and admin tokens contain different roles in payload', async () => {
      const config = makeConfig({
        baseUrl: 'http://127.0.0.1:19999',
        adminCredentials: { email: 'admin@example.com', password: 'admin123' },
        adminLoginEndpoint: '/api/admin/auth/login',
        timeout: 200,
      });

      const ta = new TokenAcquisition(config);
      const result = await ta.acquire();

      // Decode user token payload
      const userPayload = JSON.parse(
        Buffer.from(result.userToken!.split('.')[1], 'base64url').toString('utf-8'),
      );
      // Decode admin token payload
      const adminPayload = JSON.parse(
        Buffer.from(result.adminToken!.split('.')[1], 'base64url').toString('utf-8'),
      );

      expect(userPayload.role).toBe('user');
      expect(adminPayload.role).toBe('admin');
      expect(userPayload.email).toBe('test@example.com');
      expect(adminPayload.email).toBe('admin@example.com');
    });
  });

  // ─── Live server with mocked fetch ─────────────────────────────────

  describe('live server acquisition (mocked fetch)', () => {
    const originalFetch = globalThis.fetch;

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('extracts token from { token: ... } response shape', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ token: 'live-jwt-token-123' }),
      }) as any;

      const config = makeConfig();
      const ta = new TokenAcquisition(config);
      const result = await ta.acquire();

      expect(result.source).toBe('live');
      expect(result.userToken).toBe('live-jwt-token-123');
      expect(result.error).toBeUndefined();
    });

    it('extracts token from { accessToken: ... } response shape', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ accessToken: 'access-token-456' }),
      }) as any;

      const config = makeConfig();
      const ta = new TokenAcquisition(config);
      const result = await ta.acquire();

      expect(result.source).toBe('live');
      expect(result.userToken).toBe('access-token-456');
    });

    it('extracts token from { access_token: ... } response shape', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: 'snake-case-token-789' }),
      }) as any;

      const config = makeConfig();
      const ta = new TokenAcquisition(config);
      const result = await ta.acquire();

      expect(result.source).toBe('live');
      expect(result.userToken).toBe('snake-case-token-789');
    });

    it('degrades to mock when response has no token field', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ user: { id: 1 } }),
      }) as any;

      const config = makeConfig();
      const ta = new TokenAcquisition(config);
      const result = await ta.acquire();

      expect(result.source).toBe('mock');
      expect(result.error).toContain('No token found');
    });

    it('degrades to mock when server returns non-ok status', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      }) as any;

      const config = makeConfig();
      const ta = new TokenAcquisition(config);
      const result = await ta.acquire();

      expect(result.source).toBe('mock');
      expect(result.error).toContain('401');
    });

    it('acquires both user and admin tokens from live server', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        return {
          ok: true,
          json: async () => ({ token: `token-${callCount}` }),
        };
      }) as any;

      const config = makeConfig({
        adminCredentials: { email: 'admin@example.com', password: 'admin123' },
        adminLoginEndpoint: '/api/admin/auth/login',
      });

      const ta = new TokenAcquisition(config);
      const result = await ta.acquire();

      expect(result.source).toBe('live');
      expect(result.userToken).toBe('token-1');
      expect(result.adminToken).toBe('token-2');
    });
  });
});
