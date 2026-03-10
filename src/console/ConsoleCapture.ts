/**
 * ConsoleCapture — Console spy and noise filter for Dixie CLI Browser.
 *
 * Installs spies on console.error, console.warn, and optionally
 * console.log / console.info / console.debug. Captured messages are
 * stored raw and can be retrieved either unfiltered or with
 * configurable noise patterns applied.
 *
 * Only ONE ConsoleCapture instance can be installed at a time.
 * Installing a second instance automatically uninstalls the first.
 */

// ═══════════════════════════════════════════════════════════════════════
// Default noise patterns — known framework noise to suppress
// ═══════════════════════════════════════════════════════════════════════

export const DEFAULT_NOISE_PATTERNS: (string | RegExp)[] = [
  // React Query
  'No queryFn was passed',
  'No QueryClient set',

  // React 18 deprecations
  'defaultProps will be removed',
  'ReactDOM.render is no longer supported',

  // React testing act() warnings
  /act\(/,
  'not wrapped in act',
  'Cannot update a component',
  'Cannot update during an existing state transition',

  // Auth providers
  'No refresh token',
  'No auth token',

  // Observers (no layout engine)
  'ResizeObserver',
  'IntersectionObserver',

  // Layout effects
  'useLayoutEffect',

  // External SDKs
  /[Ss]tripe/,
  /google/i,

  // Network in test env
  'AbortError',
  /socket/i,
  'WebSocket',
  /beacon/i,
  /cloudflare/i,

  // API errors in test
  /\/api\//,
];

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

export interface ConsoleCaptureOptions {
  /** Additional noise patterns to merge with defaults. Pass [] to use only defaults. */
  noisePatterns?: (string | RegExp)[];
  /** Capture console.log calls (default: false). */
  captureLog?: boolean;
  /** Capture console.info calls (default: false). */
  captureInfo?: boolean;
  /** Capture console.debug calls (default: false). */
  captureDebug?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════
// Global singleton tracker
// ═══════════════════════════════════════════════════════════════════════

let _activeInstance: ConsoleCapture | null = null;

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════

/**
 * Stringify console arguments the same way a real console would join them.
 * Optimized: fast path for single string argument (most common case).
 */
function stringifyArgs(args: unknown[]): string {
  // Fast path: single string argument (overwhelmingly common)
  if (args.length === 1 && typeof args[0] === 'string') {
    return args[0];
  }
  // Fast path: no arguments
  if (args.length === 0) {
    return '';
  }
  return args
    .map((a) => (typeof a === 'string' ? a : String(a)))
    .join(' ');
}

/**
 * Build a combined RegExp from all regex patterns and extract string patterns.
 * Used for pre-compiled noise matching.
 */
function buildCompiledNoise(patterns: (string | RegExp)[]): {
  stringPatterns: string[];
  combinedRegex: RegExp | null;
} {
  const stringPatterns: string[] = [];
  const regexSources: string[] = [];

  for (const pattern of patterns) {
    if (typeof pattern === 'string') {
      stringPatterns.push(pattern);
    } else {
      // Wrap each regex source in a non-capturing group with its flags applied inline
      const flags = pattern.flags;
      if (flags.includes('i')) {
        regexSources.push(`(?:(?:${pattern.source}))`);
      } else {
        regexSources.push(`(?:${pattern.source})`);
      }
    }
  }

  // Build combined regex — we need case-insensitive handling per-pattern,
  // so we test regex patterns individually for correctness
  return {
    stringPatterns,
    combinedRegex: null, // Will use individual regex test for correctness
  };
}

/**
 * Check whether a message matches ANY of the given noise patterns.
 * Uses pre-extracted string patterns and regex patterns for speed.
 */
function isNoiseCompiled(
  message: string,
  stringPatterns: string[],
  regexPatterns: RegExp[],
): boolean {
  // Check string patterns first (faster — just indexOf/includes)
  for (let i = 0; i < stringPatterns.length; i++) {
    if (message.includes(stringPatterns[i])) return true;
  }
  // Check regex patterns
  for (let i = 0; i < regexPatterns.length; i++) {
    if (regexPatterns[i].test(message)) return true;
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════════════
// ConsoleCapture class
// ═══════════════════════════════════════════════════════════════════════

export class ConsoleCapture {
  // ── Captured call arrays ──────────────────────────────────────────
  private _rawErrors: string[] = [];
  private _rawWarnings: string[] = [];
  private _rawLogs: string[] = [];

  // ── Noise patterns (original mixed array for getNoisePatterns()) ──
  private _noisePatterns: (string | RegExp)[];
  private _initialPatterns: (string | RegExp)[];

  // ── Pre-compiled noise patterns (split by type for fast matching) ──
  private _stringPatterns: string[] = [];
  private _regexPatterns: RegExp[] = [];

  // ── Filter cache (invalidated on capture or pattern change) ───────
  private _cachedErrors: string[] | null = null;
  private _cachedWarnings: string[] | null = null;
  private _cachedLogs: string[] | null = null;
  private _errorCountAtCache = 0;
  private _warningCountAtCache = 0;
  private _logCountAtCache = 0;

  // ── Options ───────────────────────────────────────────────────────
  private _captureLog: boolean;
  private _captureInfo: boolean;
  private _captureDebug: boolean;

  // ── Saved originals ───────────────────────────────────────────────
  private _origError: typeof console.error | null = null;
  private _origWarn: typeof console.warn | null = null;
  private _origLog: typeof console.log | null = null;
  private _origInfo: typeof console.info | null = null;
  private _origDebug: typeof console.debug | null = null;

  // ── State ─────────────────────────────────────────────────────────
  private _installed = false;

  constructor(options?: ConsoleCaptureOptions) {
    const opts = options ?? {};

    // Build initial pattern set: if caller passed noisePatterns, use those
    // merged with defaults. If they passed an explicit empty array, that
    // means "only use these" (which is nothing), so we honour that.
    if (opts.noisePatterns !== undefined) {
      this._initialPatterns = [...opts.noisePatterns];
      this._noisePatterns = [...opts.noisePatterns];
    } else {
      this._initialPatterns = [...DEFAULT_NOISE_PATTERNS];
      this._noisePatterns = [...DEFAULT_NOISE_PATTERNS];
    }

    this._recompilePatterns();

    this._captureLog = opts.captureLog ?? false;
    this._captureInfo = opts.captureInfo ?? false;
    this._captureDebug = opts.captureDebug ?? false;
  }

  /**
   * Split the mixed _noisePatterns array into separate string and regex arrays
   * for faster matching. Called on construction and pattern changes.
   */
  private _recompilePatterns(): void {
    const strings: string[] = [];
    const regexes: RegExp[] = [];
    for (const p of this._noisePatterns) {
      if (typeof p === 'string') {
        strings.push(p);
      } else {
        regexes.push(p);
      }
    }
    this._stringPatterns = strings;
    this._regexPatterns = regexes;
    this._invalidateCache();
  }

  /**
   * Invalidate all filter caches.
   */
  private _invalidateCache(): void {
    this._cachedErrors = null;
    this._cachedWarnings = null;
    this._cachedLogs = null;
    this._errorCountAtCache = 0;
    this._warningCountAtCache = 0;
    this._logCountAtCache = 0;
  }

  // ═══════════════════════════════════════════════════════════════════
  // Install / Uninstall
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Replace console.error, console.warn (and optionally log/info/debug)
   * with spies that capture all calls.
   *
   * If another ConsoleCapture is already installed, it is uninstalled first.
   * Calling install() on an already-installed instance is a no-op.
   */
  install(): void {
    // Idempotent: if already installed, do nothing
    if (this._installed) return;

    // If another instance is active, uninstall it
    if (_activeInstance !== null && _activeInstance !== this) {
      _activeInstance.uninstall();
    }

    // Save originals
    this._origError = console.error;
    this._origWarn = console.warn;

    // Install spies for error and warn (always)
    console.error = (...args: unknown[]) => {
      this._rawErrors.push(stringifyArgs(args));
      this._cachedErrors = null; // Invalidate error cache
    };

    console.warn = (...args: unknown[]) => {
      this._rawWarnings.push(stringifyArgs(args));
      this._cachedWarnings = null; // Invalidate warning cache
    };

    // Optional: log
    if (this._captureLog) {
      this._origLog = console.log;
      console.log = (...args: unknown[]) => {
        this._rawLogs.push(stringifyArgs(args));
        this._cachedLogs = null;
      };
    }

    // Optional: info
    if (this._captureInfo) {
      this._origInfo = console.info;
      console.info = (...args: unknown[]) => {
        this._rawLogs.push(stringifyArgs(args));
        this._cachedLogs = null;
      };
    }

    // Optional: debug
    if (this._captureDebug) {
      this._origDebug = console.debug;
      console.debug = (...args: unknown[]) => {
        this._rawLogs.push(stringifyArgs(args));
        this._cachedLogs = null;
      };
    }

    this._installed = true;
    _activeInstance = this;
  }

  /**
   * Restore original console methods. No-op if not installed.
   */
  uninstall(): void {
    if (!this._installed) return;

    // Restore originals
    if (this._origError) console.error = this._origError;
    if (this._origWarn) console.warn = this._origWarn;
    if (this._origLog) console.log = this._origLog;
    if (this._origInfo) console.info = this._origInfo;
    if (this._origDebug) console.debug = this._origDebug;

    // Clear saved references
    this._origError = null;
    this._origWarn = null;
    this._origLog = null;
    this._origInfo = null;
    this._origDebug = null;

    this._installed = false;
    if (_activeInstance === this) {
      _activeInstance = null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Convenience property getters
  // ═══════════════════════════════════════════════════════════════════

  get errors(): string[] {
    return this.getErrors();
  }

  get warnings(): string[] {
    return this.getWarnings();
  }

  // Filtered getters (noise removed)
  // ═══════════════════════════════════════════════════════════════════

  /** Get captured errors with noise filtered out. */
  getErrors(): string[] {
    // Return cached result if raw array hasn't grown and cache exists
    if (this._cachedErrors !== null && this._rawErrors.length === this._errorCountAtCache) {
      return [...this._cachedErrors];
    }
    const result = this._rawErrors.filter(
      (msg) => !isNoiseCompiled(msg, this._stringPatterns, this._regexPatterns),
    );
    this._cachedErrors = result;
    this._errorCountAtCache = this._rawErrors.length;
    return [...result];
  }

  /** Get captured warnings with noise filtered out. */
  getWarnings(): string[] {
    if (this._cachedWarnings !== null && this._rawWarnings.length === this._warningCountAtCache) {
      return [...this._cachedWarnings];
    }
    const result = this._rawWarnings.filter(
      (msg) => !isNoiseCompiled(msg, this._stringPatterns, this._regexPatterns),
    );
    this._cachedWarnings = result;
    this._warningCountAtCache = this._rawWarnings.length;
    return [...result];
  }

  /** Get captured logs (log + info + debug) with noise filtered out. */
  getLogs(): string[] {
    if (this._cachedLogs !== null && this._rawLogs.length === this._logCountAtCache) {
      return [...this._cachedLogs];
    }
    const result = this._rawLogs.filter(
      (msg) => !isNoiseCompiled(msg, this._stringPatterns, this._regexPatterns),
    );
    this._cachedLogs = result;
    this._logCountAtCache = this._rawLogs.length;
    return [...result];
  }

  /** Get all captured calls (filtered) in a single object. */
  getAll(): { errors: string[]; warnings: string[]; logs: string[] } {
    return {
      errors: this.getErrors(),
      warnings: this.getWarnings(),
      logs: this.getLogs(),
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // Raw getters (unfiltered)
  // ═══════════════════════════════════════════════════════════════════

  /** Get ALL captured errors including noise. */
  getRawErrors(): string[] {
    return [...this._rawErrors];
  }

  /** Get ALL captured warnings including noise. */
  getRawWarnings(): string[] {
    return [...this._rawWarnings];
  }

  // ═══════════════════════════════════════════════════════════════════
  // Noise pattern management
  // ═══════════════════════════════════════════════════════════════════

  /** Add a noise pattern. Takes effect immediately on subsequent getErrors/getWarnings calls. */
  addNoisePattern(pattern: string | RegExp): void {
    this._noisePatterns.push(pattern);
    this._recompilePatterns();
  }

  /** Remove a noise pattern (by reference for RegExp, by value for string). */
  removeNoisePattern(pattern: string | RegExp): void {
    const idx = this._noisePatterns.indexOf(pattern);
    if (idx !== -1) {
      this._noisePatterns.splice(idx, 1);
      this._recompilePatterns();
    }
  }

  /** Get a copy of the current noise patterns. */
  getNoisePatterns(): (string | RegExp)[] {
    return [...this._noisePatterns];
  }

  // ═══════════════════════════════════════════════════════════════════
  // Reset
  // ═══════════════════════════════════════════════════════════════════

  /** Clear all captured calls. Keeps noise patterns and install state. */
  reset(): void {
    this._rawErrors = [];
    this._rawWarnings = [];
    this._rawLogs = [];
    this._invalidateCache();
  }

  /** Clear all captured calls AND reset noise patterns to constructor defaults. Keeps install state. */
  resetAll(): void {
    this._rawErrors = [];
    this._rawWarnings = [];
    this._rawLogs = [];
    this._noisePatterns = [...this._initialPatterns];
    this._recompilePatterns();
  }

  // ═══════════════════════════════════════════════════════════════════
  // State
  // ═══════════════════════════════════════════════════════════════════

  /** Whether spies are currently installed on console. */
  isInstalled(): boolean {
    return this._installed;
  }
}
