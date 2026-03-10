/**
 * Tests for the extended `dixie diff` command — environment snapshot comparison.
 * Covers acceptance criteria 9 and edge cases 2, 5.
 */
import { describe, it, expect } from 'vitest';

import { diffSnapshots } from '../src/cli/commands/diff';
import { execute as diffExecute } from '../src/cli/commands/diff';
import { parseArgs } from '../src/cli';

// Snapshot fixtures
const SNAPSHOT_LOCAL = {
  meta: { url: 'http://localhost:3000/projects', timestamp: '2026-03-07T10:00:00Z', env: 'localhost' },
  dom: {
    tagCounts: { DIV: 45, P: 12, BUTTON: 8, TABLE: 2, TR: 20, TD: 60 },
    structureHash: 'abc123def456',
    textContent: 'Active Projects (5)',
  },
  network: [
    { url: '/api/projects', method: 'GET', status: 200, body: { projects: [{ id: 1, name: 'Project A' }] } },
    { url: '/api/clients', method: 'GET', status: 200, body: { clients: [{ id: 1, name: 'Client A' }] } },
  ],
  data: {
    '/api/projects': { projects: [{ id: 1, name: 'Project A' }] },
    '/api/clients': { clients: [{ id: 1, name: 'Client A' }] },
  },
};

const SNAPSHOT_PROD = {
  meta: { url: 'https://example.com/projects', timestamp: '2026-03-07T10:01:00Z', env: 'production' },
  dom: {
    tagCounts: { DIV: 45, P: 12, BUTTON: 8, TABLE: 2, TR: 22, TD: 66 },
    structureHash: 'abc123def456',
    textContent: 'Active Projects (6)',
  },
  network: [
    { url: '/api/projects', method: 'GET', status: 200, body: { projects: [{ id: 1, name: 'Project A' }, { id: 2, name: 'Project B' }] } },
    { url: '/api/clients', method: 'GET', status: 200, body: { clients: [{ id: 1, name: 'Client A' }] } },
  ],
  data: {
    '/api/projects': { projects: [{ id: 1, name: 'Project A' }, { id: 2, name: 'Project B' }] },
    '/api/clients': { clients: [{ id: 1, name: 'Client A' }] },
  },
};

const SNAPSHOT_IDENTICAL = JSON.parse(JSON.stringify(SNAPSHOT_LOCAL));

describe('diff — DOM differences', () => {
  it('detects changed tag counts between environments', () => {
    const result = diffSnapshots(SNAPSHOT_LOCAL, SNAPSHOT_PROD);
    const domChanges = result.changes.filter(c => c.scope === 'dom');

    const trChange = domChanges.find(c => c.path?.includes('TR'));
    expect(trChange).not.toBeUndefined();
    expect(trChange!.type).toBe('changed');
    expect(trChange!.before).toBe(20);
    expect(trChange!.after).toBe(22);
  });

  it('detects changed text content', () => {
    const result = diffSnapshots(SNAPSHOT_LOCAL, SNAPSHOT_PROD);
    const textChange = result.changes.find(c => c.path?.includes('textContent'));

    expect(textChange).not.toBeUndefined();
    expect(textChange!.before).toBe('Active Projects (5)');
    expect(textChange!.after).toBe('Active Projects (6)');
  });

  it('reports no DOM structure hash change when structure is same', () => {
    const result = diffSnapshots(SNAPSHOT_LOCAL, SNAPSHOT_PROD);
    const hashChange = result.changes.find(c => c.path?.includes('structureHash'));
    expect(hashChange).toBeUndefined();
  });
});

describe('diff — data/API differences', () => {
  it('detects added items in API response arrays', () => {
    const result = diffSnapshots(SNAPSHOT_LOCAL, SNAPSHOT_PROD);
    const dataChanges = result.changes.filter(c => c.scope === 'data');

    const addedProject = dataChanges.find(
      c => c.type === 'added' && JSON.stringify(c.value)?.includes('Project B'),
    );
    expect(addedProject).not.toBeUndefined();
  });

  it('reports no changes for identical API responses', () => {
    const result = diffSnapshots(SNAPSHOT_LOCAL, SNAPSHOT_PROD);
    const clientChanges = result.changes.filter(
      c => c.scope === 'data' && c.path?.includes('/api/clients'),
    );
    expect(clientChanges).toHaveLength(0);
  });
});

describe('diff — network differences', () => {
  it('detects different network response bodies', () => {
    const result = diffSnapshots(SNAPSHOT_LOCAL, SNAPSHOT_PROD);
    const networkChanges = result.changes.filter(c => c.scope === 'network');

    expect(networkChanges.length).toBeGreaterThan(0);
  });
});

describe('diff — meta differences', () => {
  it('detects URL differences between environments', () => {
    const result = diffSnapshots(SNAPSHOT_LOCAL, SNAPSHOT_PROD);
    const urlChange = result.changes.find(c => c.path?.includes('url'));

    expect(urlChange).not.toBeUndefined();
    expect(urlChange!.before).toBe('http://localhost:3000/projects');
    expect(urlChange!.after).toBe('https://example.com/projects');
  });
});

describe('diff — identical snapshots (edge case 5)', () => {
  it('returns empty changes array for identical snapshots (deep copy)', () => {
    const result = diffSnapshots(SNAPSHOT_IDENTICAL, JSON.parse(JSON.stringify(SNAPSHOT_LOCAL)));
    expect(result.changes).toEqual([]);
  });
});

describe('diff — output format', () => {
  it('output is structured JSON with changes array', () => {
    const result = diffSnapshots(SNAPSHOT_LOCAL, SNAPSHOT_PROD);

    expect(result).toHaveProperty('changes');
    expect(Array.isArray(result.changes)).toBe(true);

    for (const change of result.changes) {
      expect(change).toHaveProperty('type');
      expect(['added', 'removed', 'changed']).toContain(change.type);
      expect(change).toHaveProperty('scope');
    }
  });
});

describe('diff — CLI execute function', () => {
  it('diff command has an execute function', () => {
    expect(typeof diffExecute).toBe('function');
  });

  it('diff command is registered in CLI', () => {
    const args = parseArgs(['diff', 'before.json', 'after.json']);
    expect(args.command).toBe('diff');
  });
});
