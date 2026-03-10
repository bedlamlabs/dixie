#!/usr/bin/env node

// Shell wrapper for Dixie CLI.
// npm requires bin scripts to be .js or extensionless.
// This bootstraps tsx to run the TypeScript entry point.

const { resolve, dirname } = require('path');
const { execFileSync } = require('child_process');

const entry = resolve(__dirname, 'dixie.ts');

// tsx may be hoisted to the project root or nested in our own node_modules.
// Use require.resolve to find it wherever npm put it.
let tsxBin;
try {
  const tsxPkg = require.resolve('tsx/package.json', { paths: [resolve(__dirname, '..')] });
  tsxBin = resolve(dirname(tsxPkg), 'dist', 'cli.mjs');
} catch {
  // Fallback: assume tsx is on PATH
  tsxBin = 'tsx';
}

try {
  execFileSync(process.execPath, [tsxBin, entry, ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: process.env,
  });
} catch (err) {
  process.exit(err.status ?? 1);
}
