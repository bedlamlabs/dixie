import type { ParsedArgs, CommandResult } from '../types';
import * as fs from 'node:fs';

export async function execute(args: ParsedArgs): Promise<CommandResult> {
  // Expect two positional args: before.json and after.json
  const beforePath = args.url;
  const afterPath = args.selector ?? args.rest[0];

  if (!beforePath || !afterPath) {
    return {
      exitCode: 1,
      errors: [{ code: 'MISSING_ARGS', message: 'diff requires two snapshot file paths' }],
    };
  }

  try {
    const before = JSON.parse(fs.readFileSync(beforePath, 'utf-8'));
    const after = JSON.parse(fs.readFileSync(afterPath, 'utf-8'));
    const result = diffSnapshots(before, after);

    return { exitCode: 0, data: result };
  } catch (err: any) {
    return {
      exitCode: 1,
      errors: [{ code: 'DIFF_ERROR', message: err.message }],
    };
  }
}

export interface DiffChange {
  type: 'added' | 'removed' | 'changed';
  scope?: string;
  path?: string;
  value?: any;
  before?: any;
  after?: any;
}

export interface DiffResult {
  changes: DiffChange[];
}

export interface DiffOptions {
  scope?: string[];
}

export function diffSnapshots(before: any, after: any, options?: DiffOptions): DiffResult {
  const changes: DiffChange[] = [];
  const scopes = options?.scope;

  if (scopes) {
    for (const scope of scopes) {
      diffValues(before[scope], after[scope], scope, changes, scope);
    }
  } else {
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
    for (const key of allKeys) {
      diffValues(before[key], after[key], key, changes, key);
    }
  }

  return { changes };
}

function diffValues(before: any, after: any, path: string, changes: DiffChange[], scope: string): void {
  if (before === after) return;

  if (before === undefined && after !== undefined) {
    changes.push({ type: 'added', scope, path, value: after });
    return;
  }

  if (before !== undefined && after === undefined) {
    changes.push({ type: 'removed', scope, path, value: before });
    return;
  }

  // Both are strings
  if (typeof before === 'string' && typeof after === 'string') {
    if (before !== after) {
      changes.push({ type: 'changed', scope, path, before, after, value: after });
    }
    return;
  }

  // Both are arrays
  if (Array.isArray(before) && Array.isArray(after)) {
    // Find added items
    for (const item of after) {
      if (!before.some((b: any) => deepEqual(b, item))) {
        changes.push({ type: 'added', scope, path, value: item });
      }
    }
    // Find removed items
    for (const item of before) {
      if (!after.some((a: any) => deepEqual(a, item))) {
        changes.push({ type: 'removed', scope, path, value: item });
      }
    }
    return;
  }

  // Both are objects
  if (typeof before === 'object' && typeof after === 'object' && before !== null && after !== null) {
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
    for (const key of allKeys) {
      diffValues(before[key], after[key], `${path}.${key}`, changes, scope);
    }
    return;
  }

  // Primitive mismatch
  if (before !== after) {
    changes.push({ type: 'changed', scope, path, before, after, value: after });
  }
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v: any, i: number) => deepEqual(v, b[i]));
  }
  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(k => deepEqual(a[k], b[k]));
  }
  return false;
}
