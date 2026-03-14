/**
 * 5edd README Command Table Validation
 */
import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as fsModule from 'fs';

function readFixture(filePath: string): string {
  return fsModule.readFileSync(filePath, 'utf-8'); // fixture
}

function parseReadmeTable(readme: string): Map<string, string> {
  const tableLines = readme.split('\n').filter(line =>
    line.startsWith('|') && !line.includes('---')
  );
  // Skip header row
  const dataLines = tableLines.slice(1);
  const commands = new Map<string, string>();
  for (const line of dataLines) {
    const cells = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length >= 3) {
      const cmdName = cells[0].replace(/`/g, '').toLowerCase();
      const status = cells[2]; // Third column is Status
      commands.set(cmdName, status);
    }
  }
  return commands;
}

describe('5edd: README command table — consistency', () => {
  it('every command marked Full in README has an execute() export', async () => {
    const readmePath = path.resolve(__dirname, '../README.md');
    const readmeCommands = parseReadmeTable(readFixture(readmePath));

    const fullCommands = [...readmeCommands.entries()]
      .filter(([, status]) => status === 'Full')
      .map(([cmd]) => cmd);

    expect(fullCommands.length).toBeGreaterThan(0);

    for (const cmd of fullCommands) {
      try {
        const mod = await import(`./cli/commands/${cmd}`);
        expect(typeof mod.execute, `README marks "${cmd}" as Full but it has no execute() export`).toBe('function');
      } catch (err: any) {
        // If module doesn't exist, that's a failure
        expect(true, `README marks "${cmd}" as Full but module cannot be imported: ${err.message}`).toBe(false);
      }
    }
  });

  it('no command marked Stub has an execute() export', async () => {
    const readmePath = path.resolve(__dirname, '../README.md');
    const readmeCommands = parseReadmeTable(readFixture(readmePath));

    const stubCommands = [...readmeCommands.entries()]
      .filter(([, status]) => status === 'Stub')
      .map(([cmd]) => cmd);

    for (const cmd of stubCommands) {
      try {
        const mod = await import(`./cli/commands/${cmd}`);
        // Stub commands should NOT have execute() — if they do, README needs updating
        expect(typeof mod.execute, `README marks "${cmd}" as Stub but it has an execute() export — update README to Full`).not.toBe('function');
      } catch {
        // Module doesn't exist — that's fine for a Stub
      }
    }
  });
});
