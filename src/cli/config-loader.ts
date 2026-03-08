import * as fs from 'node:fs';
import * as path from 'node:path';
import type { DixieConfig, DixieConfigV4 } from './types';

export function domainFromUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
  const host = parsed.hostname;
  const port = parsed.port;
  return port ? `${host}.${port}` : host;
}

const CONFIG_EXTENSIONS = ['.ts', '.js', '.mjs'];

const DEFAULT_CONFIG: DixieConfigV4 = {
  baseUrl: '',
  appEntry: undefined,
  routes: [],
  auth: { type: 'none', acquire: async () => '' },
  mockDataDir: undefined,
};

export async function resolveConfig(
  urlOrOptions: string | { configPath?: string },
  projectRoot?: string,
  explicitConfig?: string,
): Promise<DixieConfigV4 | DixieConfig | null> {
  // v4 API: called with { configPath? }
  if (typeof urlOrOptions === 'object') {
    if (urlOrOptions.configPath) {
      try {
        const loaded = await loadConfigFile(urlOrOptions.configPath);
        return { ...DEFAULT_CONFIG, ...loaded } as DixieConfigV4;
      } catch {
        return { ...DEFAULT_CONFIG };
      }
    }
    return { ...DEFAULT_CONFIG };
  }

  // Legacy API: called with (url, projectRoot, explicitConfig?)
  const url = urlOrOptions;

  // Explicit --config overrides domain discovery
  if (explicitConfig) {
    return loadConfigFile(explicitConfig);
  }

  const domain = domainFromUrl(url);
  const dixieDir = path.join(projectRoot!, '.dixie');

  for (const ext of CONFIG_EXTENSIONS) {
    const configPath = path.join(dixieDir, `${domain}${ext}`);
    if (fs.existsSync(configPath)) {
      return loadConfigFile(configPath);
    }
  }

  // No config found — use defaults
  return null;
}

async function loadConfigFile(configPath: string): Promise<DixieConfig> {
  const abs = path.resolve(configPath);

  if (!fs.existsSync(abs)) {
    throw new Error(`Config file not found: ${abs}`);
  }

  try {
    // For .ts files, use esbuild to transpile
    if (abs.endsWith('.ts')) {
      const esbuild = await import('esbuild');
      const source = fs.readFileSync(abs, 'utf-8');
      const result = await esbuild.transform(source, {
        loader: 'ts',
        format: 'esm',
        target: 'node18',
      });
      // Write to temp file and import
      const tmpFile = abs.replace(/\.ts$/, '.dixie-tmp.mjs');
      fs.writeFileSync(tmpFile, result.code);
      try {
        const mod = await import(`file://${tmpFile}`);
        return mod.default;
      } finally {
        fs.unlinkSync(tmpFile);
      }
    }

    // For .js and .mjs, import directly
    const mod = await import(`file://${abs}`);
    return mod.default ?? mod;
  } catch (err: any) {
    const filename = path.basename(configPath);
    throw new Error(`Failed to load config ${filename}: ${err.message}`);
  }
}
