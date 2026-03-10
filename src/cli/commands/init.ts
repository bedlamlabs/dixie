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
