export interface ParsedArgs {
  command: string;
  url?: string;
  selector?: string;
  file?: string;
  format: 'json' | 'yaml' | 'markdown' | 'csv';
  token?: string;
  timeout: number;
  noJs: boolean;
  parallel: boolean;
  verbose: boolean;
  bail: boolean;
  filter?: string;
  noColor: boolean;
  config?: string;
  selectorStrategy: 'css' | 'testId' | 'role' | 'label';
  rest: string[];
}

export interface CommandResult {
  exitCode: number;
  output?: string;
  data?: any;
  errors?: Array<{ code: string; message: string; detail?: string }>;
}

export interface DixieConfig {
  auth?: {
    baseUrl: string;
    loginEndpoint: string;
    credentials: { email: string; password: string };
  };
  mockRoutes?: Record<string, any>;
  noisePatterns?: string[];
  render?: (url: string, env: any) => any;
  [key: string]: any;
}
