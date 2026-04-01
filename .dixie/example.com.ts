/**
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
