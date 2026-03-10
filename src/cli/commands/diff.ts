import type { ParsedArgs, CommandResult } from '../types';
import { formatOutput } from '../format';

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

export async function execute(args: ParsedArgs): Promise<CommandResult> {
  // Support both `rest` (CLI positionals) and `args` (testing shorthand)
  const positions: string[] = (args as any).args ?? args.rest ?? [];
  const fileA = positions[0] ?? args.url ?? '';
  const fileB = positions[1] ?? '';

  if (!fileA || !fileB) {
    return {
      exitCode: 1,
      errors: [{ code: 'MISSING_ARGS', message: 'diff requires two file paths' }],
    };
  }

  try {
    const { readFileSync } = await import('node:fs');
    const before = JSON.parse(readFileSync(fileA, 'utf-8'));
    const after = JSON.parse(readFileSync(fileB, 'utf-8'));
    const result = diffSnapshots(before, after);
    const output = formatOutput(result, args.format ?? 'json');
    return { exitCode: 0, output, data: result };
  } catch (err: any) {
    return {
      exitCode: 1,
      errors: [{ code: 'DIFF_ERROR', message: err.message }],
    };
  }
}
