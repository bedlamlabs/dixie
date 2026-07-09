#!/usr/bin/env node

// Shell wrapper for Dixie CLI.
// npm requires bin scripts to be .js or extensionless.
//
// Fast path: run the bundled build (dist/dixie.mjs, `npm run build`) in this
// same process via dynamic import — no tsx transpile, no extra node spawn.
// Fallback: bootstrap tsx to run the TypeScript entry (dev checkouts without
// a build).

const { resolve, dirname } = require('path');
const { existsSync } = require('fs');
const { pathToFileURL } = require('url');

const bundle = resolve(__dirname, '..', 'dist', 'dixie.mjs');

if (existsSync(bundle)) {
  import(pathToFileURL(bundle).href).catch((err) => {
    console.error(err?.stack || String(err));
    process.exit(1);
  });
} else {
  const { execFileSync } = require('child_process');
  const entry = resolve(__dirname, 'dixie.ts');

  // tsx may be hoisted to the project root or nested in our own node_modules.
  let tsxBin;
  try {
    const tsxPkg = require.resolve('tsx/package.json', { paths: [resolve(__dirname, '..')] });
    tsxBin = resolve(dirname(tsxPkg), 'dist', 'cli.mjs');
  } catch {
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
}
