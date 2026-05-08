#!/usr/bin/env tsx
/**
 * Dixie CLI entry point.
 * Parses process.argv, dispatches to the appropriate command handler,
 * writes output to stdout, and exits with the command's exit code.
 */

import { parseArgs, dispatch } from '../src/cli/index.ts';
import { formatOutput } from '../src/cli/format.ts';
import { once } from 'node:events';

async function writeStdout(output: string): Promise<void> {
  if (!process.stdout.write(output)) {
    await once(process.stdout, 'drain');
  }
}

const args = parseArgs(process.argv.slice(2));
const result = await dispatch(args);

if (result.output !== undefined) {
  await writeStdout(result.output + '\n');
} else if (result.data !== undefined) {
  await writeStdout(formatOutput(result.data, args.format ?? 'json') + '\n');
} else if (result.errors !== undefined) {
  await writeStdout(formatOutput({ errors: result.errors }, args.format ?? 'json') + '\n');
}

process.exitCode = result.exitCode ?? 0;
