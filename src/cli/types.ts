export interface ParsedArgs {
  command: string;
  url?: string;
  selector?: string;
  /** Text content to search for within the rendered DOM */
  text?: string;
  /** CSS selector of element to click before querying (opens slideouts, etc.) */
  click?: string;
  file?: string;
  format: 'json' | 'yaml' | 'markdown' | 'csv';
  token?: string;
  timeout: number;
  noJs: boolean;
  parallel: boolean;
  verbose: boolean;
  bail: boolean;
  filter?: string;
  /** Category filter for the meta command (e.g., 'status', 'amount', 'date') */
  type?: string;
  /** Contract key for the meta command (e.g., 'status:e-sign-ready') */
  key?: string;
  /** Validate all expected metadata keys for the current page route against the contract */
  validate?: boolean;
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
    [key: string]: any;
  };
  /**
   * SPA rendering options — controls how the CLI waits for a JavaScript
   * framework to finish mounting before querying the DOM.
   */
  spa?: {
    /**
     * CSS selector that must be present before the DOM is considered stable.
     * Defaults to '#root > *' (Vite / CRA convention).
     *
     * Common values:
     *   '#root > *'    — Vite, Create React App, Remix
     *   '#__next > *'  — Next.js
     *   '#app > *'     — Vue CLI
     *   'app-root'     — Angular
     */
    mountSelector?: string;
  };
  /**
   * Pre-seed localStorage/sessionStorage before scripts execute.
   * Used to inject auth tokens so the SPA renders authenticated content.
   * Keys are storage keys, values are the values to set.
   */
  preseed?: {
    localStorage?: Record<string, string>;
    sessionStorage?: Record<string, string>;
  };
  /**
   * Error message patterns to suppress in the bundled IIFE.
   * When a `throw new Error("...")` matches a pattern, it's replaced with
   * a safe default return. Prevents components without error boundaries
   * from crashing React's entire tree during re-renders.
   */
  suppressErrors?: string[];
  mockRoutes?: Record<string, any>;
  noisePatterns?: string[];
  render?: (url: string, env: any) => any;
  /**
   * Metadata extraction configuration.
   * When enabled, the `meta` command collects all elements with data-meta attributes.
   * The contract file maps semantic metadata keys to their expected pages and components.
   */
  metadata?: {
    enabled: boolean;
    contract: string;
  };
  [key: string]: any;
}
