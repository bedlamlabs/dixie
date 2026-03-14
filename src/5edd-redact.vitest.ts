/**
 * 5edd Redaction Tests — expanded redactSnapshot coverage
 */
import { describe, it, expect } from 'vitest';

describe('5edd: redactSnapshot — expanded coverage', () => {
  it('redacts token fields in request body', async () => {
    const { redactSnapshot } = await import('./redact');
    const snapshot = {
      api: [{
        url: 'http://api.test/login',
        requestBody: { headers: {}, body: { token: 'my-secret-token', username: 'alice' } },
        responseHeaders: {},
      }],
    };
    const result = redactSnapshot(snapshot);
    expect(result.api[0].requestBody.body.token).toBe('[REDACTED]');
    expect(result.api[0].requestBody.body.username).toBe('alice');
  });

  it('redacts apiKey and secret fields in request body', async () => {
    const { redactSnapshot } = await import('./redact');
    const snapshot = {
      api: [{
        url: 'http://api.test/config',
        requestBody: { headers: {}, body: { apiKey: 'sk-abc123', secret: 'super-secret', name: 'test' } },
        responseHeaders: {},
      }],
    };
    const result = redactSnapshot(snapshot);
    expect(result.api[0].requestBody.body.apiKey).toBe('[REDACTED]');
    expect(result.api[0].requestBody.body.secret).toBe('[REDACTED]');
    expect(result.api[0].requestBody.body.name).toBe('test');
  });

  it('redacts query string params matching token patterns', async () => {
    const { redactSnapshot } = await import('./redact');
    const snapshot = {
      api: [{
        url: 'http://api.test/data?token=secret123&page=1',
        requestBody: { headers: {} },
        responseHeaders: {},
      }],
    };
    const result = redactSnapshot(snapshot);
    expect(result.api[0].url).not.toContain('secret123');
    expect(result.api[0].url).toContain('page=1');
  });

  it('redacts authorization in response headers', async () => {
    const { redactSnapshot } = await import('./redact');
    const snapshot = {
      api: [{
        url: 'http://api.test/data',
        requestBody: { headers: {} },
        responseHeaders: { 'set-cookie': 'session=abc123; HttpOnly', 'content-type': 'application/json' },
      }],
    };
    const result = redactSnapshot(snapshot);
    expect(result.api[0].responseHeaders['set-cookie']).toBe('[REDACTED]');
    expect(result.api[0].responseHeaders['content-type']).toBe('application/json');
  });

  it('handles nested objects in request body', async () => {
    const { redactSnapshot } = await import('./redact');
    const snapshot = {
      api: [{
        url: 'http://api.test/nested',
        requestBody: {
          headers: {},
          body: { user: { name: 'alice' }, credentials: { password: 'hunter2', apiKey: 'sk-nested' } },
        },
        responseHeaders: {},
      }],
    };
    const result = redactSnapshot(snapshot);
    expect(result.api[0].requestBody.body.credentials.password).toBe('[REDACTED]');
    expect(result.api[0].requestBody.body.credentials.apiKey).toBe('[REDACTED]');
    expect(result.api[0].requestBody.body.user.name).toBe('alice');
  });
});
