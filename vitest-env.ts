import { createDixieEnvironment } from './src/environment';
import type { DixieEnvironment } from './src/environment';

export default {
  name: 'dixie',
  transformMode: 'ssr' as const,

  async setup() {
    const env = createDixieEnvironment({ url: process.env.DIXIE_VITEST_URL || 'http://localhost/' });
    env.installGlobals();

    return {
      env,
      teardown() {
        env.uninstallGlobals();
        env.destroy();
      },
    };
  },

  async teardown() {
    // Handled by setup's return
  },
};
