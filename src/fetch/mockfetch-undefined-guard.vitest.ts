/**
 * Triage 2026-03-17 — Issue #1: MockFetch crashes on undefined/null input
 *
 * When SPA bundles call fetch() with undefined or null (e.g., a broken dynamic
 * import, or a library that conditionally calls fetch with no URL), MockFetch.fetch()
 * crashes with: TypeError: Cannot read properties of undefined (reading 'url')
 *
 * This test verifies MockFetch gracefully handles invalid input instead of crashing.
 */
import { describe, it, expect } from 'vitest';
import { MockFetch } from './MockFetch';

describe('MockFetch — undefined/null input guard', () => {
  it('should not crash when input is undefined', async () => {
    const mock = new MockFetch();
    // Simulate: fetch(undefined) — happens when SPA code passes undefined URL
    const response = await mock.fetch(undefined as any);
    expect(response).toBeDefined();
    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it('should not crash when input is null', async () => {
    const mock = new MockFetch();
    const response = await mock.fetch(null as any);
    expect(response).toBeDefined();
    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it('should not crash when input is an empty string', async () => {
    const mock = new MockFetch();
    // Empty string is technically a string, should not crash
    const response = await mock.fetch('');
    expect(response).toBeDefined();
  });

  it('should still work correctly with valid string input', async () => {
    const mock = new MockFetch();
    mock.register('/api/test', { status: 200, body: { ok: true } });
    const response = await mock.fetch('/api/test');
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
  });

  it('should still work correctly with valid DixieRequest input', async () => {
    const mock = new MockFetch();
    mock.register('/api/test', { status: 200, body: { ok: true } });
    // Import DixieRequest to test the non-string path
    const { DixieRequest } = await import('./Request');
    const request = new DixieRequest('/api/test');
    const response = await mock.fetch(request);
    expect(response.status).toBe(200);
  });
});
