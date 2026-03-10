#!/usr/bin/env node
import { parseArgs, dispatch } from '../src/cli/index.js';

const args = parseArgs(process.argv.slice(2));
const result = await dispatch(args);

if (result.output !== undefined) {
  process.stdout.write(result.output + '\n');
}

process.exit(result.exitCode ?? 0);
