/**
 * TokenAcquisition — real JWT token acquisition from a running server,
 * with graceful degradation to mock tokens when the server is unavailable.
 *
 * Uses native fetch (NOT MockFetch) — this runs before mocks are installed.
 * Tokens are cached per instance: acquire() called once, subsequent calls
 * return the cached result.
 */

// ── Public types ──────────────────────────────────────────────────────

export interface TokenConfig {
  baseUrl: string;
  loginEndpoint: string;
  adminLoginEndpoint?: string;
  credentials: { email: string; password: string };
  adminCredentials?: { email: string; password: string };
  domainAllowlist?: string[];
  timeout?: number;
}

export interface TokenResult {
  userToken: string | null;
  adminToken: string | null;
  source: 'live' | 'mock';
  error?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────

/** Base64url encode (no padding, URL-safe) */
function base64urlEncode(str: string): string {
  return Buffer.from(str, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ── Implementation ───────────────────────────────────────────────────

export class TokenAcquisition {
  private _config: TokenConfig;
  private _cached: TokenResult | null = null;

  constructor(config: TokenConfig) {
    this._validateConfig(config);
    this._config = config;
  }

  /**
   * Acquire tokens from a real server. If the server is down or
   * unreachable, gracefully degrade to mock tokens.
   */
  async acquire(): Promise<TokenResult> {
    // Return cached if already acquired
    if (this._cached !== null) {
      return this._cached;
    }

    // Validate domain allowlist before attempting
    const domainError = this._validateDomains();
    if (domainError) {
      const result: TokenResult = {
        userToken: TokenAcquisition.generateMockToken({ email: this._config.credentials.email, role: 'user', mock: true }),
        adminToken: this._config.adminCredentials
          ? TokenAcquisition.generateMockToken({ email: this._config.adminCredentials.email, role: 'admin', mock: true })
          : null,
        source: 'mock',
        error: domainError,
      };
      this._cached = result;
      return result;
    }

    const timeout = this._config.timeout ?? 5000;

    // Acquire user token — this is the critical path
    let userToken: string | null = null;
    try {
      userToken = await this._fetchToken(
        this._config.baseUrl + this._config.loginEndpoint,
        this._config.credentials,
        timeout,
      );
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      // User login failed — graceful degradation to mock tokens
      const result: TokenResult = {
        userToken: TokenAcquisition.generateMockToken({ email: this._config.credentials.email, role: 'user', mock: true }),
        adminToken: this._config.adminCredentials
          ? TokenAcquisition.generateMockToken({ email: this._config.adminCredentials.email, role: 'admin', mock: true })
          : null,
        source: 'mock',
        error: errorMessage,
      };
      this._cached = result;
      return result;
    }

    // Acquire admin token (if configured) — failure is non-fatal
    // Admin login may fail if the test account doesn't have admin access.
    // The user token is still valid and sufficient for rendering client pages.
    let adminToken: string | null = null;
    if (this._config.adminCredentials && this._config.adminLoginEndpoint) {
      try {
        adminToken = await this._fetchToken(
          this._config.baseUrl + this._config.adminLoginEndpoint,
          this._config.adminCredentials,
          timeout,
        );
      } catch {
        // Admin login failed — continue with user token only
        adminToken = null;
      }
    }

    const result: TokenResult = {
      userToken,
      adminToken,
      source: 'live',
    };
    this._cached = result;
    return result;
  }

  /**
   * Get cached tokens (acquired once, reused across all tests).
   */
  getCached(): TokenResult | null {
    return this._cached;
  }

  /**
   * Clear cached tokens so the next acquire() call fetches fresh ones.
   */
  clearCache(): void {
    this._cached = null;
  }

  /**
   * Generate a mock JWT token with base64-encoded payload.
   * Returns a valid-looking JWT: header.payload.signature
   */
  static generateMockToken(payload?: Record<string, unknown>): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const body = {
      sub: 'mock-user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      ...payload,
    };

    const encodedHeader = base64urlEncode(JSON.stringify(header));
    const encodedPayload = base64urlEncode(JSON.stringify(body));
    const signature = base64urlEncode('mock-signature-' + Date.now());

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  // ── Private helpers ────────────────────────────────────────────────

  private _validateConfig(config: TokenConfig): void {
    if (!config.baseUrl) {
      throw new Error('TokenAcquisition: baseUrl is required');
    }
    if (!config.loginEndpoint) {
      throw new Error('TokenAcquisition: loginEndpoint is required');
    }
    if (!config.credentials) {
      throw new Error('TokenAcquisition: credentials is required');
    }
    if (!config.credentials.email) {
      throw new Error('TokenAcquisition: credentials.email is required');
    }
    if (!config.credentials.password) {
      throw new Error('TokenAcquisition: credentials.password is required');
    }
  }

  /**
   * Validate that all credential emails match the domain allowlist.
   * Returns an error string if validation fails, null if OK.
   */
  private _validateDomains(): string | null {
    const allowlist = this._config.domainAllowlist;
    if (!allowlist || allowlist.length === 0) {
      return null;
    }

    const email = this._config.credentials.email;
    const emailDomain = '@' + email.split('@')[1];
    if (!allowlist.some(d => emailDomain === d)) {
      return `Domain '${emailDomain}' not in allowlist: ${allowlist.join(', ')}`;
    }

    if (this._config.adminCredentials) {
      const adminEmail = this._config.adminCredentials.email;
      const adminDomain = '@' + adminEmail.split('@')[1];
      if (!allowlist.some(d => adminDomain === d)) {
        return `Admin domain '${adminDomain}' not in allowlist: ${allowlist.join(', ')}`;
      }
    }

    return null;
  }

  /**
   * Fetch a token from the server with timeout handling.
   */
  private async _fetchToken(
    url: string,
    credentials: { email: string; password: string },
    timeout: number,
  ): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Login failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as Record<string, unknown>;

      // Look for token in common response shapes
      const token = (data.token ?? data.accessToken ?? data.access_token) as string | undefined;
      if (!token) {
        throw new Error('No token found in login response');
      }

      return token;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
