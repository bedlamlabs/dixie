#!/usr/bin/env tsx
/**
 * Dixie CLI entry point.
 * Parses process.argv, dispatches to the appropriate command handler,
 * writes output to stdout, and exits with the command's exit code.
 */

import { parseArgs, dispatch } from '../src/cli/index.ts';
import { formatOutput } from '../src/cli/format.ts';

const args = parseArgs(process.argv.slice(2));
const result = await dispatch(args);

if (result.output !== undefined) {
  process.stdout.write(result.output + '\n');
} else if (result.data !== undefined) {
  process.stdout.write(formatOutput(result.data, args.format ?? 'json') + '\n');
}

process.exit(result.exitCode ?? 0);
