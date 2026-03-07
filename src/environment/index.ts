/**
 * Environment — the core Dixie API for creating isolated browser environments.
 */

export { createDixieEnvironment } from './DixieEnvironment';
export type { DixieEnvironment, DixieEnvironmentOptions } from './DixieEnvironment';
export { EnvironmentPool } from './EnvironmentPool';
export type { PoolOptions, PoolStats } from './EnvironmentPool';
export { installGlobals } from './installGlobals';
export type { GlobalInstallation } from './installGlobals';
