/**
 * ContractValidator — validate that mock fetch calls match expected API contract shapes.
 *
 * Define endpoint contracts (method, path pattern, request body types, response shapes),
 * then validate requests against those contracts. Reports violations and coverage.
 */

// ── Public interfaces ──────────────────────────────────────────────────

export interface EndpointContract {
  method: string;
  pathPattern: string;
  requestBody?: Record<string, string>;
  responseShape?: Record<string, string>;
  requiredHeaders?: string[];
}

export interface ContractViolation {
  url: string;
  method: string;
  violation: string;
  expected?: string;
  actual?: string;
}

export interface ValidationResult {
  valid: boolean;
  violations: ContractViolation[];
  coverage: {
    defined: number;
    called: number;
    uncalled: string[];
    undocumented: string[];
  };
}

// ── Implementation ─────────────────────────────────────────────────────

export class ContractValidator {
  private _contracts: EndpointContract[] = [];

  constructor() {}

  /**
   * Define an endpoint contract.
   */
  define(contract: EndpointContract): void {
    this._contracts.push(contract);
  }

  /**
   * Define multiple contracts at once.
   */
  defineAll(contracts: EndpointContract[]): void {
    for (const c of contracts) {
      this._contracts.push(c);
    }
  }

  /**
   * Validate a single request against contracts.
   * Returns an array of violations (empty if valid).
   */
  validateRequest(url: string, method: string, body?: unknown): ContractViolation[] {
    const violations: ContractViolation[] = [];
    const upperMethod = method.toUpperCase();

    // Find matching contracts by path pattern
    const pathMatches = this._contracts.filter(c => this._matchesPath(url, c.pathPattern));

    if (pathMatches.length === 0) {
      // No contract for this path — undocumented endpoint, not a violation per se
      // (coverage tracks this). Return empty.
      return violations;
    }

    // Check if any contract matches both path AND method
    const fullMatch = pathMatches.find(c => c.method.toUpperCase() === upperMethod);
    if (!fullMatch) {
      // Path matched but method didn't
      const allowedMethods = pathMatches.map(c => c.method.toUpperCase()).join(', ');
      violations.push({
        url,
        method: upperMethod,
        violation: `Method ${upperMethod} not allowed for this endpoint`,
        expected: allowedMethods,
        actual: upperMethod,
      });
      return violations;
    }

    // Validate request body if contract defines expected body fields
    if (fullMatch.requestBody && body !== undefined && body !== null) {
      const bodyObj = typeof body === 'string' ? ContractValidator._tryParseJSON(body) : body;
      if (bodyObj && typeof bodyObj === 'object' && !Array.isArray(bodyObj)) {
        const record = bodyObj as Record<string, unknown>;
        for (const [field, expectedType] of Object.entries(fullMatch.requestBody)) {
          if (!(field in record)) {
            violations.push({
              url,
              method: upperMethod,
              violation: `Missing required body field: ${field}`,
              expected: `${field}: ${expectedType}`,
              actual: 'field not present',
            });
          } else {
            const actualType = ContractValidator._typeOf(record[field]);
            if (actualType !== expectedType) {
              violations.push({
                url,
                method: upperMethod,
                violation: `Wrong type for body field: ${field}`,
                expected: expectedType,
                actual: actualType,
              });
            }
          }
        }
      }
    }

    return violations;
  }

  /**
   * Validate all recorded requests from a request log.
   */
  validateAll(requestLog: Array<{ url: string; method: string; body?: unknown }>): ValidationResult {
    const allViolations: ContractViolation[] = [];

    for (const req of requestLog) {
      const body = typeof req.body === 'string' ? ContractValidator._tryParseJSON(req.body) : req.body;
      const violations = this.validateRequest(req.url, req.method, body);
      allViolations.push(...violations);
    }

    const cov = this.coverage(requestLog);

    return {
      valid: allViolations.length === 0 && cov.undocumented.length === 0,
      violations: allViolations,
      coverage: cov,
    };
  }

  /**
   * Get coverage report.
   */
  coverage(requestLog: Array<{ url: string; method: string }>): ValidationResult['coverage'] {
    const calledKeys = new Set<string>();
    const undocumented: string[] = [];

    for (const req of requestLog) {
      const upperMethod = req.method.toUpperCase();
      let matched = false;

      for (const contract of this._contracts) {
        if (contract.method.toUpperCase() === upperMethod && this._matchesPath(req.url, contract.pathPattern)) {
          calledKeys.add(`${contract.method.toUpperCase()} ${contract.pathPattern}`);
          matched = true;
          break;
        }
      }

      if (!matched) {
        const key = `${upperMethod} ${req.url}`;
        if (!undocumented.includes(key)) {
          undocumented.push(key);
        }
      }
    }

    const allKeys = this._contracts.map(c => `${c.method.toUpperCase()} ${c.pathPattern}`);
    const uncalled = allKeys.filter(k => !calledKeys.has(k));

    return {
      defined: this._contracts.length,
      called: calledKeys.size,
      uncalled,
      undocumented,
    };
  }

  /**
   * Clear all contracts.
   */
  clear(): void {
    this._contracts = [];
  }

  // ── Private helpers ────────────────────────────────────────────────

  /**
   * Check if a URL matches a path pattern.
   * Pattern segments like :id, :companyId match any non-slash value.
   */
  private _matchesPath(url: string, pattern: string): boolean {
    // Strip query string and hash from URL
    const urlPath = url.split('?')[0].split('#')[0];

    const patternParts = pattern.split('/').filter(p => p.length > 0);
    const urlParts = urlPath.split('/').filter(p => p.length > 0);

    if (patternParts.length !== urlParts.length) return false;

    for (let i = 0; i < patternParts.length; i++) {
      const pp = patternParts[i];
      if (pp.startsWith(':')) {
        // Param segment — matches any non-empty value
        if (urlParts[i].length === 0) return false;
        continue;
      }
      if (pp !== urlParts[i]) return false;
    }

    return true;
  }

  /**
   * Determine the type string for a value.
   */
  private static _typeOf(value: unknown): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

  /**
   * Try to parse a string as JSON, return null if it fails.
   */
  private static _tryParseJSON(str: string): unknown {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  }
}
