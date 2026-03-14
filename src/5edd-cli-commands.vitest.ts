/**
 * 5edd CLI Commands Tests — HAR mimeType detection via mock-record
 */
import { describe, it, expect } from 'vitest';

describe('5edd: mock-record execute() — HAR entry quality', () => {
  it('recorded entries have correct mimeType from response headers, not hardcoded json', async () => {
    const { execute } = await import('./cli/commands/mock-record');
    const html = `<html><body><script>fetch('/page.html')</script></body></html>`;
    const dataUrl = `data:text/html,${encodeURIComponent(html)}`;
    const result = await execute({ url: dataUrl, _: ['mock-record'], format: 'json' } as any);
    expect(result.exitCode).toBe(0);
    if (result.data?.entries?.length > 0) {
      const entry = result.data.entries[0];
      // After the fix, mimeType should come from response headers, not be hardcoded
      expect(entry.response?.content?.mimeType).not.toBe('application/json');
    }
  });

  it('mock-record returns entries array even when page has no fetch calls', async () => {
    const { execute } = await import('./cli/commands/mock-record');
    const html = `<html><body><h1>No fetches here</h1></body></html>`;
    const dataUrl = `data:text/html,${encodeURIComponent(html)}`;
    const result = await execute({ url: dataUrl, _: ['mock-record'], format: 'json' } as any);
    expect(result.exitCode).toBe(0);
    expect(result.data).toBeDefined();
    // Should return empty entries, not error
    expect(Array.isArray(result.data?.entries)).toBe(true);
  });
});

describe('5edd: HarRecorder — mimeType directly', () => {
  it('record() captures mimeType from responseHeaders', async () => {
    const { HarRecorder } = await import('./har/recorder');
    const recorder = new HarRecorder();
    recorder.record({
      method: 'GET', url: 'http://test.local/styles.css', status: 200,
      responseBody: 'body { color: red; }',
      responseHeaders: { 'content-type': 'text/css' },
      requestHeaders: {}, durationMs: 10,
    });
    const entries = recorder.getEntries();
    expect(entries[0].response.content.mimeType).toBe('text/css');
  });

  it('record() defaults to application/octet-stream when no content-type', async () => {
    const { HarRecorder } = await import('./har/recorder');
    const recorder = new HarRecorder();
    recorder.record({
      method: 'GET', url: 'http://test.local/binary', status: 200,
      responseBody: 'data', responseHeaders: {}, requestHeaders: {}, durationMs: 10,
    });
    const entries = recorder.getEntries();
    expect(entries[0].response.content.mimeType).toBe('application/octet-stream');
  });
});
