/**
 * Dixie SPA config example
 *
 * For SPAs that serve an empty HTML shell (e.g. React, Vue, Svelte),
 * configure an SSR endpoint so Dixie gets pre-rendered HTML instead
 * of an empty <div id="root"></div>.
 *
 * Your app must provide the SSR endpoint. Dixie just consumes it.
 * See README.md "Working with SPAs" for implementation details.
 *
 * Auto-loaded when you run:
 *   dixie render http://localhost:3000/app/dashboard
 */
import type { DixieConfig } from '../src/cli/types';

const config: DixieConfig = {
  auth: {
    baseUrl: 'http://localhost:3000',
    loginEndpoint: '/api/auth/login',
    credentials: {
      email: 'test@example.com',
      password: 'password123',
    },
  },

  // SPA rendering — Dixie fetches pre-rendered HTML from this endpoint
  // instead of the raw SPA shell.
  //
  // When you run: dixie render http://localhost:3000/app/dashboard
  // Dixie fetches: GET http://localhost:3000/ssr/render?path=/app/dashboard
  // with the auth token in the Authorization header.
  spa: {
    ssrEndpoint: '/ssr/render',
    fallback: 'shell',  // 'shell' = fall back to raw HTML on SSR failure
  },

  noisePatterns: [
    'favicon.ico',
    'hot-update',
  ],
};

export default config;
