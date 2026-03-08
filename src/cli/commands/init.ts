import * as fs from 'node:fs';
import * as path from 'node:path';

const EXAMPLE_CONFIG = `/**
 * Dixie domain config for example.com
 *
 * This file is auto-loaded when you run:
 *   dixie render https://example.com
 *
 * Customize auth, mock routes, noise patterns,
 * and render function for your domain.
 */
export default {
  auth: {
    baseUrl: 'https://example.com',
    loginEndpoint: '/api/auth/login',
    credentials: {
      email: 'test@example.com',
      password: 'your-password-here',
    },
  },

  mockRoutes: {
    '/api/users': { body: [{ id: 1, name: 'Test User' }] },
  },

  noisePatterns: [
    'cloudflare',
    'analytics',
  ],
};
`;

const DIXIE_CONFIG_TEMPLATE = `/**
 * Dixie v4 config — app-specific settings for your project.
 *
 * This file is loaded by dixie at startup.
 */
import type { DixieConfigV4 } from 'dixie';

const config: DixieConfigV4 = {
  baseUrl: 'http://localhost:3000',
  appEntry: './src/main.tsx',
  routes: ['/'],
  auth: { type: 'none' },
};

export default config;
`;

export interface InitResult {
  created: string[];
  skipped: string[];
  files: Record<string, string>;
}

export async function scaffoldInit(projectDir: string): Promise<InitResult> {
  const dixieDir = path.join(projectDir, '.dixie');
  const result: InitResult = {
    created: [],
    skipped: [],
    files: {},
  };

  // Create .dixie/ if it doesn't exist
  if (!fs.existsSync(dixieDir)) {
    fs.mkdirSync(dixieDir, { recursive: true });
  }

  // Write example config (don't overwrite existing)
  const examplePath = path.join(dixieDir, 'example.com.ts');
  if (fs.existsSync(examplePath)) {
    result.skipped.push('example.com.ts');
  } else {
    fs.writeFileSync(examplePath, EXAMPLE_CONFIG);
    result.created.push('.dixie/example.com.ts');
    result.files['example.com.ts'] = EXAMPLE_CONFIG;
  }

  // Don't overwrite any existing files
  const existingFiles = fs.readdirSync(dixieDir);
  for (const file of existingFiles) {
    if (!result.created.includes(`.dixie/${file}`) && file !== 'example.com.ts') {
      result.skipped.push(file);
    }
  }

  return result;
}

/**
 * Execute init command. Supports dryRun mode for testing.
 */
export async function execute(args: {
  command: string;
  url?: string;
  file?: string;
  _?: string[];
  format?: string;
  dryRun?: boolean;
  projectDir?: string;
}): Promise<{ exitCode: number; data?: any; errors?: any[] }> {
  const projectDir = args.projectDir ?? args.file ?? args.url ?? process.cwd();

  if (args.dryRun) {
    // Dry run: return what would be created without writing
    const dixieConfigTemplate = DIXIE_CONFIG_TEMPLATE;
    return {
      exitCode: 0,
      data: {
        command: 'init',
        status: 'ok',
        files: {
          'dixie.config.ts': dixieConfigTemplate,
        },
        config: {
          template: 'dixie.config.ts',
          dryRun: true,
        },
      },
    };
  }

  try {
    const result = await scaffoldInit(projectDir);
    return {
      exitCode: 0,
      data: {
        command: 'init',
        status: 'ok',
        ...result,
      },
    };
  } catch (err: any) {
    return {
      exitCode: 1,
      data: { command: 'init', error: err.message },
      errors: [{ code: 'INIT_ERROR', message: err.message }],
    };
  }
}
