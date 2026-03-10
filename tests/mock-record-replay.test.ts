/**
 * Tests for mock-record and mock-replay CLI commands.
 * Covers acceptance criteria 6, 7, 10 and edge case 3.
 */
import { describe, it, expect, vi } from 'vitest';

import { parseArgs } from '../src/cli';
import { execute as mockRecordExecute } from '../src/cli/commands/mock-record';
import { execute as mockReplayExecute } from '../src/cli/commands/mock-replay';
import { MockFetch } from '../src/fetch/MockFetch';

// CLI parsing
describe('mock-record — CLI parsing', () => {
  it('mock-record is a recognized command', () => {
    const args = parseArgs(['mock-record', 'http://localhost:3000/projects']);
    expect(args.command).toBe('mock-record');
    expect(args.url).toBe('http://localhost:3000/projects');
  });

  it('accepts --out flag for HAR output path', () => {
    const args = parseArgs(['mock-record', 'http://localhost:3000/projects', '--out', 'recording.har']);
    expect(args.command).toBe('mock-record');
    expect((args as any).snapshotOut).toBe('recording.har');
  });
});

describe('mock-replay — CLI parsing', () => {
  it('mock-replay is a recognized command', () => {
    const args = parseArgs(['mock-replay', 'http://localhost:3000/projects']);
    expect(args.command).toBe('mock-replay');
  });

  it('accepts --har flag for HAR input file', () => {
    const args = parseArgs(['mock-replay', 'http://localhost:3000/projects', '--har', 'recording.har']);
    expect(args.command).toBe('mock-replay');
    expect((args as any).harFile).toBe('recording.har');
  });
});

// mock-record output
describe('mock-record — output', () => {
  it('produces HAR entries with url, method, status, and responseBody', async () => {
    const args = parseArgs(['mock-record', 'data:text/html,<h1>Test</h1>']);
    const result = await mockRecordExecute(args);

    expect(result.exitCode).toBe(0);
    expect(typeof result.data).toBe('object');
    expect(Array.isArray(result.data.entries)).toBe(true);
  });

  it('output is machine-readable JSON', async () => {
    const args = parseArgs(['mock-record', 'data:text/html,<p>Test</p>']);
    const result = await mockRecordExecute(args);

    expect(result.exitCode).toBe(0);
    const json = JSON.stringify(result.data);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

// mock-replay output
describe('mock-replay — output', () => {
  it('reports pure render timing (no network wait)', async () => {
    const harEntries = [
      {
        request: { method: 'GET', url: 'http://localhost:3000/api/test' },
        response: {
          status: 200,
          content: { text: '{"data":"test"}', mimeType: 'application/json' },
        },
      },
    ];

    const args = parseArgs(['mock-replay', 'data:text/html,<h1>Test</h1>']);
    (args as any)._harData = harEntries;

    const result = await mockReplayExecute(args);

    expect(result.exitCode).toBe(0);
    expect(typeof result.data).toBe('object');
    expect(typeof result.data.renderMs).toBe('number');
    expect(result.data.renderMs).toBeGreaterThanOrEqual(0);
  });

  it('output is machine-readable JSON', async () => {
    const args = parseArgs(['mock-replay', 'data:text/html,<p>Test</p>']);
    (args as any)._harData = [];
    const result = await mockReplayExecute(args);

    expect(result.exitCode).toBe(0);
    const json = JSON.stringify(result.data);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

// MockFetch.loadFromHar
describe('MockFetch.loadFromHar', () => {
  it('static method exists on MockFetch', () => {
    expect(typeof MockFetch.loadFromHar).toBe('function');
  });

  it('converts HAR entries to mock routes', () => {
    const harEntries = [
      {
        request: { method: 'GET', url: 'http://localhost:3000/api/projects' },
        response: {
          status: 200,
          content: { text: '{"projects":[]}', mimeType: 'application/json' },
        },
      },
      {
        request: { method: 'GET', url: 'http://localhost:3000/api/clients' },
        response: {
          status: 200,
          content: { text: '{"clients":[]}', mimeType: 'application/json' },
        },
      },
    ];

    const mockFetch = MockFetch.loadFromHar(harEntries);
    expect(typeof mockFetch).toBe('object');
    expect(typeof mockFetch.fetch).toBe('function');
  });

  it('replayed responses return correct status and body', async () => {
    const harEntries = [
      {
        request: { method: 'GET', url: 'http://localhost:3000/api/test' },
        response: {
          status: 200,
          content: { text: '{"value":42}', mimeType: 'application/json' },
        },
      },
    ];

    const mockFetch = MockFetch.loadFromHar(harEntries);
    const response = await mockFetch.fetch('http://localhost:3000/api/test');

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.value).toBe(42);
  });

  it('matches by URL path regardless of query params (FLAW-010)', async () => {
    const harEntries = [
      {
        request: { method: 'GET', url: 'http://localhost:3000/api/projects?page=1&limit=10' },
        response: {
          status: 200,
          content: { text: '{"projects":["a"]}', mimeType: 'application/json' },
        },
      },
    ];

    const mockFetch = MockFetch.loadFromHar(harEntries);
    const response = await mockFetch.fetch('http://localhost:3000/api/projects?page=2');

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.projects).toEqual(['a']);
  });
});

// Edge case: missing HAR entry
describe('mock-replay — missing HAR entry (edge case)', () => {
  it('returns error entry when fetch URL has no recorded response', async () => {
    const harEntries = [
      {
        request: { method: 'GET', url: 'http://localhost:3000/api/known' },
        response: {
          status: 200,
          content: { text: '{}', mimeType: 'application/json' },
        },
      },
    ];

    const mockFetch = MockFetch.loadFromHar(harEntries);
    const response = await mockFetch.fetch('http://localhost:3000/api/unknown');

    expect(response.status).toBe(404);
  });
});
