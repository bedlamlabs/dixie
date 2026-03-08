/**
 * 508f.cli.test.ts — CLI Command Completeness
 *
 * AC 4: All 26 CLI commands must have working execute() exports
 * AC 12: 5 new CLI commands produce structured JSON output
 * Edge Case 4: CLI command error handling
 *
 * Tests go in dixie-standalone/tests/ during /do
 */
import { describe, it, expect } from 'vitest';

// All 26 registered CLI commands
const ALL_COMMANDS = [
  'render', 'query', 'run', 'bench', 'diff', 'a11y', 'css-audit',
  'links', 'forms', 'text', 'structure', 'api', 'expected-calls',
  'click', 'type', 'select', 'inspect', 'init', 'component',
  'fidelity', 'lighthouse', 'har', 'redact',
  'snapshot', 'mock-record', 'mock-replay',
];

// Commands that need NEW execute() exports (don't have one yet)
const COMMANDS_NEEDING_EXECUTE = [
  'query', 'run', 'bench', 'a11y', 'css-audit',
  'links', 'forms', 'text', 'structure', 'api', 'expected-calls',
  'click', 'type', 'select', 'inspect', 'init', 'component',
  'fidelity', 'lighthouse', 'har', 'redact',
];

// ── AC 4: All 26 commands have execute() ───────────────────────────
describe('CLI command execute() exports', () => {
  it.each(COMMANDS_NEEDING_EXECUTE)('%s command exports execute() function', async (command) => {
    const mod = await import(`../src/cli/commands/${command}.ts`);
    expect(typeof mod.execute).toBe('function');
  });
});

// ── AC 4 continued: execute() returns correct shape ────────────────
describe('CLI command return shape', () => {
  it.each(ALL_COMMANDS)('%s execute() returns { exitCode, data }', async (command) => {
    const mod = await import(`../src/cli/commands/${command}.ts`);

    // Call with minimal args — should return structured result, not throw
    const result = await mod.execute({
      command,
      url: 'http://test.local/',
      _: [],
      format: 'json',
    });

    expect(result).toHaveProperty('exitCode');
    expect(typeof result.exitCode).toBe('number');
    expect(result).toHaveProperty('data');
  });
});

// ── AC 12: New commands produce structured JSON ────────────────────
const NEW_COMMANDS = ['inspect', 'component', 'fidelity', 'lighthouse', 'redact'];

describe('new CLI commands structured output', () => {
  it.each(NEW_COMMANDS)('%s returns structured JSON data', async (command) => {
    const mod = await import(`../src/cli/commands/${command}.ts`);

    const result = await mod.execute({
      command,
      url: 'http://test.local/',
      _: [],
      format: 'json',
    });

    expect(result.exitCode).toBe(0);
    expect(result.data).toBeDefined();
    expect(typeof result.data).toBe('object');
    expect(result.data.command).toBe(command);
    expect(result.data.status).not.toBe('stub');
  });
});

// ── Edge Case 4: Error handling ────────────────────────────────────
describe('CLI command error handling', () => {
  it.each(ALL_COMMANDS)('%s returns exitCode 1 on error, not unhandled throw', async (command) => {
    const mod = await import(`../src/cli/commands/${command}.ts`);

    // Call with deliberately invalid args (no URL, no selector)
    // Commands must catch and return { exitCode: 1, error: ... }
    // not throw unhandled exceptions
    try {
      const result = await mod.execute({
        command,
        url: '',
        _: [],
        format: 'json',
      });

      // If it returns, it must be a structured error
      if (result.exitCode !== 0) {
        expect(result.exitCode).toBe(1);
        expect(result.error ?? result.data?.error).toBeDefined();
      }
    } catch (e) {
      // Should NOT reach here — commands must handle errors internally
      expect.fail(`${command} threw unhandled exception: ${(e as Error).message}`);
    }
  });
});

// ── Stub detection ─────────────────────────────────────────────────
describe('no remaining stubs', () => {
  it('run command is not a stub', async () => {
    const mod = await import('../src/cli/commands/run.ts');
    const result = await mod.execute({
      command: 'run',
      url: 'http://test.local/',
      _: [],
      format: 'json',
    });
    expect(result.data?.status).not.toBe('stub');
  });

  it('bench command is not a stub', async () => {
    const mod = await import('../src/cli/commands/bench.ts');
    const result = await mod.execute({
      command: 'bench',
      url: 'http://test.local/',
      _: [],
      format: 'json',
    });
    expect(result.data?.status).not.toBe('stub');
  });

  it('init command is not a stub', async () => {
    const mod = await import('../src/cli/commands/init.ts');
    const result = await mod.execute({
      command: 'init',
      url: 'http://test.local/',
      _: [],
      format: 'json',
    });
    expect(result.data?.status).not.toBe('stub');
  });
});
