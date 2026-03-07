/**
 * Assertions barrel export.
 */
export { DixieAssertions } from './DixieAssertions';
export type { AssertionResult, ConsoleCaptureLike } from './DixieAssertions';

export { DixieSnapshot } from './DixieSnapshot';
export type {
  DOMState,
  PageSummary,
  FormSummary,
  LinkSummary,
  HeadingSummary,
  ImageSummary,
} from './DixieSnapshot';

export { PerformanceBudget } from './PerformanceBudget';
export type { BudgetConfig, BudgetResult, BudgetViolation } from './PerformanceBudget';

export { DiffSnapshot } from './DiffSnapshot';
export type {
  DiffEntry,
  DiffResult,
  SnapshotData,
  SnapshotNode,
} from './DiffSnapshot';
