/**
 * 5edd Render Hardening Tests — HTML parsing, token redaction, HAR mimeType
 */
import { describe, it, expect } from 'vitest';

describe('5edd: render command — HTML parsing edge cases', () => {
  it('HTML with > inside attribute values parses correctly', async () => {
    const { execute } = await import('./cli/commands/render');
    const html = `<html><head><title>Test</title></head><body data-info="x>y"><h1>Works</h1></body></html>`;
    const dataUrl = `data:text/html,${encodeURIComponent(html)}`;
    const result = await execute({ url: dataUrl, _: ['render'], format: 'json' } as any);
    expect(result.exitCode).toBe(0);
    expect(result.data).toBeDefined();
    const seen = new WeakSet();
    const output = JSON.stringify(result.data, (key, val) => {
      if (typeof val === 'object' && val !== null) { if (seen.has(val)) return '[Circular]'; seen.add(val); }
      return val;
    });
    expect(output).toContain('Works');
  });
});

describe('5edd: render command — token redaction in output', () => {
  it('render output meta does not contain tokenValue', async () => {
    const { execute } = await import('./cli/commands/render');
    const html = `<html><body><h1>Token Test</h1></body></html>`;
    const dataUrl = `data:text/html,${encodeURIComponent(html)}`;
    const result = await execute({ url: dataUrl, _: ['render'], format: 'json', token: 'test-secret-token-value' } as any);
    expect(result.exitCode).toBe(0);
    const seen = new WeakSet();
    const outputStr = JSON.stringify(result.data, (key, val) => {
      if (typeof val === 'object' && val !== null) { if (seen.has(val)) return '[Circular]'; seen.add(val); }
      return val;
    });
    expect(outputStr).not.toContain('test-secret-token-value');
    if (result.data?.meta) {
      expect(result.data.meta.tokenValue).toBeUndefined();
    }
  });
});

describe('5edd: HAR recorder — mimeType detection', () => {
  it('HAR entry mimeType matches response Content-Type header, not hardcoded json', async () => {
    const { HarRecorder } = await import('./har/recorder');
    const recorder = new HarRecorder();
    recorder.record({
      method: 'GET', url: 'http://test.local/page', status: 200,
      responseBody: '<html><body>Test</body></html>',
      responseHeaders: { 'content-type': 'text/html; charset=utf-8' },
      requestHeaders: {}, durationMs: 50,
    });
    const entries = recorder.getEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].response.content.mimeType).toBe('text/html; charset=utf-8');
  });

  it('HAR entry falls back to application/octet-stream when no Content-Type', async () => {
    const { HarRecorder } = await import('./har/recorder');
    const recorder = new HarRecorder();
    recorder.record({
      method: 'GET', url: 'http://test.local/binary', status: 200,
      responseBody: 'binary data', responseHeaders: {}, requestHeaders: {}, durationMs: 100,
    });
    const entries = recorder.getEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].response.content.mimeType).toBe('application/octet-stream');
  });
});
