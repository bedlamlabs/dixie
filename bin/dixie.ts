#!/usr/bin/env npx tsx
import { parseArgs, dispatch } from '../src/cli';

const args = parseArgs(process.argv.slice(2));
dispatch(args).then(result => {
  if (result.output) {
    process.stdout.write(result.output + '\n');
  }
  if (result.errors && result.errors.length > 0) {
    for (const err of result.errors) {
      process.stderr.write(`${err.code}: ${err.message}\n`);
    }
  }
  process.exit(result.exitCode);
}).catch(err => {
  process.stderr.write(`DIXIE_FATAL: ${err.message}\n`);
  process.exit(1);
});
