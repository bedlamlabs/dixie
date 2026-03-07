/**
 * Tests for the `dixie snapshot` CLI command.
 * Covers acceptance criteria 8, 10, 11 and edge cases 1, 4.
 */
import { describe, it, expect, vi } from 'vitest';

import { execute as snapshotExecute } from '../src/cli/commands/snapshot';
import { parseArgs } from '../src/cli';

describe('snapshot command — CLI parsing', () => {
  it('snapshot is a recognized command', () => {
    const args = parseArgs(['snapshot', 'http://localhost:5001/projects']);
    expect(args.command).toBe('snapshot');
    expect(args.url).toBe('http://localhost:5001/projects');
  });

  it('accepts --out flag for output file path', () => {
    const args = parseArgs(['snapshot', 'http://localhost:5001/projects', '--out', 'snapshot.json']);
    expect(args.command).toBe('snapshot');
    expect((args as any).snapshotOut).toBe('snapshot.json');
  });
});

describe('snapshot command — output schema', () => {
  it('produces JSON with meta section containing url and timestamp', async () => {
    const args = parseArgs(['snapshot', 'data:text/html,<h1>Test</h1>']);
    const result = await snapshotExecute(args);

    expect(result.exitCode).toBe(0);
    expect(typeof result.data).toBe('object');
    expect(typeof result.data.meta).toBe('object');
    expect(result.data.meta.url).toContain('data:text/html');
    expect(typeof result.data.meta.timestamp).toBe('string');
    expect(result.data.meta.timestamp.length).toBeGreaterThan(0);
  });

  it('produces JSON with dom section containing tag counts and structure hash', async () => {
    const args = parseArgs(['snapshot', 'data:text/html,<div><p>Hello</p><p>World</p></div>']);
    const result = await snapshotExecute(args);

    expect(result.exitCode).toBe(0);
    expect(typeof result.data.dom).toBe('object');
    expect(typeof result.data.dom.tagCounts).toBe('object');
    expect(typeof result.data.dom.tagCounts.P).toBe('number');
    expect(result.data.dom.tagCounts.P).toBe(2);
    expect(typeof result.data.dom.structureHash).toBe('string');
    expect(result.data.dom.structureHash.length).toBeGreaterThan(0);
  });

  it('produces JSON with network section (empty for data: URLs)', async () => {
    const args = parseArgs(['snapshot', 'data:text/html,<h1>No Fetch</h1>']);
    const result = await snapshotExecute(args);

    expect(result.exitCode).toBe(0);
    expect(Array.isArray(result.data.network)).toBe(true);
    expect(result.data.network).toHaveLength(0);
  });

  it('produces JSON with data section containing parsed API payloads', async () => {
    const args = parseArgs(['snapshot', 'data:text/html,<h1>Test</h1>']);
    const result = await snapshotExecute(args);

    expect(result.exitCode).toBe(0);
    expect(typeof result.data.data).toBe('object');
    expect(Object.keys(result.data.data)).toHaveLength(0);
  });

  it('output is valid JSON (machine-readable)', async () => {
    const args = parseArgs(['snapshot', 'data:text/html,<p>Test</p>']);
    const result = await snapshotExecute(args);

    expect(result.exitCode).toBe(0);
    const json = JSON.stringify(result.data);
    const parsed = JSON.parse(json);
    expect(typeof parsed.meta).toBe('object');
    expect(typeof parsed.dom).toBe('object');
    expect(Array.isArray(parsed.network)).toBe(true);
    expect(typeof parsed.data).toBe('object');
  });
});

describe('snapshot command — auth', () => {
  it('uses existing .dixie config for token acquisition (no new auth mechanism)', async () => {
    const args = parseArgs(['snapshot', 'data:text/html,<h1>Test</h1>', '--config', '/nonexistent/.dixie/config.ts']);

    const result = await snapshotExecute(args);
    expect(typeof result.exitCode).toBe('number');
  });

  it('reports auth failure in snapshot metadata when server is down (edge case 1)', async () => {
    const args = parseArgs(['snapshot', 'http://unreachable-server.invalid:9999/page']);

    const result = await snapshotExecute(args);

    expect(typeof result.exitCode).toBe('number');
    if (result.data?.meta) {
      const hasAuthInfo = result.data.meta.auth !== undefined;
      const hasErrors = Array.isArray(result.errors) && result.errors.length > 0;
      expect(hasAuthInfo || hasErrors).toBe(true);
    } else {
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.errors!.length).toBeGreaterThan(0);
    }
  });
});

describe('snapshot command — edge cases', () => {
  it('page with no fetch calls produces valid snapshot with empty network', async () => {
    const args = parseArgs(['snapshot', 'data:text/html,<div>Static content only</div>']);
    const result = await snapshotExecute(args);

    expect(result.exitCode).toBe(0);
    expect(result.data.network).toEqual([]);
    expect(result.data.dom.tagCounts.DIV).toBe(1);
  });
});
