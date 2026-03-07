import { describe, it, expect } from 'vitest';
import { ContractValidator } from '../src/fetch/ContractValidator';
import type { EndpointContract } from '../src/fetch/ContractValidator';

// ═══════════════════════════════════════════════════════════════════════
// ContractValidator
// ═══════════════════════════════════════════════════════════════════════

describe('ContractValidator', () => {
  // ── define() ──────────────────────────────────────────────────────

  describe('define()', () => {
    it('registers a contract', () => {
      const cv = new ContractValidator();
      cv.define({
        method: 'GET',
        pathPattern: '/api/invoices',
      });

      // Verify it's registered by checking coverage
      const cov = cv.coverage([]);
      expect(cov.defined).toBe(1);
    });
  });

  // ── defineAll() ───────────────────────────────────────────────────

  describe('defineAll()', () => {
    it('registers multiple contracts', () => {
      const cv = new ContractValidator();
      cv.defineAll([
        { method: 'GET', pathPattern: '/api/invoices' },
        { method: 'POST', pathPattern: '/api/invoices' },
        { method: 'GET', pathPattern: '/api/clients' },
      ]);

      const cov = cv.coverage([]);
      expect(cov.defined).toBe(3);
    });
  });

  // ── validateRequest() ─────────────────────────────────────────────

  describe('validateRequest()', () => {
    it('passes for matching request', () => {
      const cv = new ContractValidator();
      cv.define({
        method: 'GET',
        pathPattern: '/api/invoices',
      });

      const violations = cv.validateRequest('/api/invoices', 'GET');
      expect(violations).toHaveLength(0);
    });

    it('catches wrong method', () => {
      const cv = new ContractValidator();
      cv.define({
        method: 'GET',
        pathPattern: '/api/invoices',
      });

      const violations = cv.validateRequest('/api/invoices', 'DELETE');
      expect(violations).toHaveLength(1);
      expect(violations[0].violation).toContain('Method');
      expect(violations[0].violation).toContain('DELETE');
    });

    it('catches missing required body field', () => {
      const cv = new ContractValidator();
      cv.define({
        method: 'POST',
        pathPattern: '/api/invoices',
        requestBody: {
          amount: 'number',
          description: 'string',
        },
      });

      const violations = cv.validateRequest('/api/invoices', 'POST', { amount: 100 });
      expect(violations).toHaveLength(1);
      expect(violations[0].violation).toContain('Missing');
      expect(violations[0].violation).toContain('description');
    });

    it('catches wrong body field type', () => {
      const cv = new ContractValidator();
      cv.define({
        method: 'POST',
        pathPattern: '/api/invoices',
        requestBody: {
          amount: 'number',
          description: 'string',
        },
      });

      const violations = cv.validateRequest('/api/invoices', 'POST', {
        amount: 'not-a-number',
        description: 'valid string',
      });

      expect(violations).toHaveLength(1);
      expect(violations[0].violation).toContain('Wrong type');
      expect(violations[0].violation).toContain('amount');
      expect(violations[0].expected).toBe('number');
      expect(violations[0].actual).toBe('string');
    });

    it('matches path patterns with params (/api/invoices/:id)', () => {
      const cv = new ContractValidator();
      cv.define({
        method: 'GET',
        pathPattern: '/api/invoices/:id',
      });

      const violations = cv.validateRequest('/api/invoices/123', 'GET');
      expect(violations).toHaveLength(0);

      const violations2 = cv.validateRequest('/api/invoices/abc-def', 'GET');
      expect(violations2).toHaveLength(0);
    });
  });

  // ── validateAll() ─────────────────────────────────────────────────

  describe('validateAll()', () => {
    it('validates all requests in log', () => {
      const cv = new ContractValidator();
      cv.defineAll([
        { method: 'GET', pathPattern: '/api/invoices' },
        {
          method: 'POST',
          pathPattern: '/api/invoices',
          requestBody: { amount: 'number' },
        },
      ]);

      const result = cv.validateAll([
        { url: '/api/invoices', method: 'GET' },
        { url: '/api/invoices', method: 'POST', body: JSON.stringify({ amount: 100 }) },
      ]);

      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('reports coverage', () => {
      const cv = new ContractValidator();
      cv.defineAll([
        { method: 'GET', pathPattern: '/api/invoices' },
        { method: 'POST', pathPattern: '/api/invoices' },
        { method: 'GET', pathPattern: '/api/clients' },
      ]);

      const result = cv.validateAll([
        { url: '/api/invoices', method: 'GET' },
      ]);

      expect(result.coverage.defined).toBe(3);
      expect(result.coverage.called).toBe(1);
      expect(result.coverage.uncalled).toContain('POST /api/invoices');
      expect(result.coverage.uncalled).toContain('GET /api/clients');
    });
  });

  // ── coverage() ────────────────────────────────────────────────────

  describe('coverage()', () => {
    it('tracks called vs uncalled contracts', () => {
      const cv = new ContractValidator();
      cv.defineAll([
        { method: 'GET', pathPattern: '/api/invoices' },
        { method: 'GET', pathPattern: '/api/clients' },
        { method: 'GET', pathPattern: '/api/projects' },
      ]);

      const cov = cv.coverage([
        { url: '/api/invoices', method: 'GET' },
        { url: '/api/clients', method: 'GET' },
      ]);

      expect(cov.defined).toBe(3);
      expect(cov.called).toBe(2);
      expect(cov.uncalled).toEqual(['GET /api/projects']);
    });

    it('identifies undocumented API calls', () => {
      const cv = new ContractValidator();
      cv.define({
        method: 'GET',
        pathPattern: '/api/invoices',
      });

      const cov = cv.coverage([
        { url: '/api/invoices', method: 'GET' },
        { url: '/api/unknown-endpoint', method: 'POST' },
      ]);

      expect(cov.undocumented).toHaveLength(1);
      expect(cov.undocumented[0]).toBe('POST /api/unknown-endpoint');
    });
  });

  // ── clear() ───────────────────────────────────────────────────────

  describe('clear()', () => {
    it('removes all contracts', () => {
      const cv = new ContractValidator();
      cv.defineAll([
        { method: 'GET', pathPattern: '/api/invoices' },
        { method: 'GET', pathPattern: '/api/clients' },
      ]);

      expect(cv.coverage([]).defined).toBe(2);

      cv.clear();
      expect(cv.coverage([]).defined).toBe(0);
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────

  describe('Edge cases', () => {
    it('multiple contracts for same path with different methods', () => {
      const cv = new ContractValidator();
      cv.defineAll([
        { method: 'GET', pathPattern: '/api/invoices/:id' },
        { method: 'PATCH', pathPattern: '/api/invoices/:id', requestBody: { status: 'string' } },
        { method: 'DELETE', pathPattern: '/api/invoices/:id' },
      ]);

      const getViolations = cv.validateRequest('/api/invoices/123', 'GET');
      expect(getViolations).toHaveLength(0);

      const patchViolations = cv.validateRequest('/api/invoices/123', 'PATCH', { status: 'paid' });
      expect(patchViolations).toHaveLength(0);

      const deleteViolations = cv.validateRequest('/api/invoices/123', 'DELETE');
      expect(deleteViolations).toHaveLength(0);

      // POST is not defined for this path
      const postViolations = cv.validateRequest('/api/invoices/123', 'POST');
      expect(postViolations).toHaveLength(1);
      expect(postViolations[0].violation).toContain('Method');
    });

    it('partial body validation (extra fields allowed)', () => {
      const cv = new ContractValidator();
      cv.define({
        method: 'POST',
        pathPattern: '/api/invoices',
        requestBody: {
          amount: 'number',
        },
      });

      // Extra fields should not cause violations
      const violations = cv.validateRequest('/api/invoices', 'POST', {
        amount: 100,
        extraField: 'extra-value',
        anotherExtra: true,
      });

      expect(violations).toHaveLength(0);
    });

    it('nested path patterns (/api/companies/:companyId/invoices/:id)', () => {
      const cv = new ContractValidator();
      cv.define({
        method: 'GET',
        pathPattern: '/api/companies/:companyId/invoices/:id',
      });

      const violations = cv.validateRequest('/api/companies/abc/invoices/456', 'GET');
      expect(violations).toHaveLength(0);

      // Wrong path structure should not match (path length differs)
      const violations2 = cv.validateRequest('/api/companies/abc/invoices', 'GET');
      // This path has different segment count, won't match — returns empty (undocumented, not a violation)
      expect(violations2).toHaveLength(0);
    });

    it('validates string body by parsing JSON', () => {
      const cv = new ContractValidator();
      cv.define({
        method: 'POST',
        pathPattern: '/api/invoices',
        requestBody: {
          amount: 'number',
          description: 'string',
        },
      });

      // Pass body as JSON string (as MockFetch records it)
      const violations = cv.validateRequest(
        '/api/invoices',
        'POST',
        JSON.stringify({ amount: 50, description: 'Test' }),
      );
      expect(violations).toHaveLength(0);
    });

    it('validateAll marks invalid when undocumented calls exist', () => {
      const cv = new ContractValidator();
      cv.define({ method: 'GET', pathPattern: '/api/invoices' });

      const result = cv.validateAll([
        { url: '/api/invoices', method: 'GET' },
        { url: '/api/rogue-endpoint', method: 'POST' },
      ]);

      expect(result.valid).toBe(false);
      expect(result.coverage.undocumented).toHaveLength(1);
    });

    it('handles URL with query string', () => {
      const cv = new ContractValidator();
      cv.define({ method: 'GET', pathPattern: '/api/invoices' });

      const violations = cv.validateRequest('/api/invoices?page=1&limit=10', 'GET');
      expect(violations).toHaveLength(0);
    });

    it('case-insensitive method matching', () => {
      const cv = new ContractValidator();
      cv.define({ method: 'GET', pathPattern: '/api/invoices' });

      const violations = cv.validateRequest('/api/invoices', 'get');
      expect(violations).toHaveLength(0);
    });
  });
});
