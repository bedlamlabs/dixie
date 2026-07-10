#!/usr/bin/env tsx
/**
 * Dixie CLI entry point.
 * Parses process.argv, dispatches to the appropriate command handler,
 * writes output to stdout, and exits with the command's exit code.
 */

import { parseArgs, dispatch } from '../src/cli/index.ts';
import { formatOutput } from '../src/cli/format.ts';

async function writeStdout(output: string): Promise<void> {
  // Wait for the write callback, not just 'drain': write() returning true only
  // means the chunk fit under the highWaterMark, not that it was flushed to the
  // pipe. The process.exit() below would truncate anything still buffered.
  await new Promise<void>((resolve, reject) => {
    process.stdout.write(output, (err) => (err ? reject(err) : resolve()));
  });
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

// Backstop exit: commands dispose their TimerController after collecting
// results (clearing page-scheduled timers/intervals), but page scripts can
// still hold the loop open through handles dispose can't reach (sockets,
// MessageChannel ports, native fetch keep-alives). Output is fully flushed above.
process.exit(result.exitCode ?? 0);
