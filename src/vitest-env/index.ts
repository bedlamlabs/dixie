/**
 * Vitest Environment — Dixie as a vitest environment plugin.
 *
 * Usage in vitest.config.ts:
 * ```ts
 * export default defineConfig({
 *   test: {
 *     environment: './src/vitest-env/dixie-environment.ts',
 *   }
 * });
 * ```
 *
 * Or per-file:
 * ```ts
 * // @vitest-environment dixie
 * ```
 */

export { default as dixieEnvironment } from './dixie-environment';
export { setupDixieGlobals } from './dixie-environment';
export type { DixieVitestEnvironment } from './dixie-environment';
