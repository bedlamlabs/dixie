/**
 * Observers — MutationObserver (functional), ResizeObserver & IntersectionObserver (stubs).
 */

export { MutationObserver, triggerMutation, flushMutations, clearMutationRegistry } from './MutationObserver';
export type { MutationObserverInit, MutationCallback } from './MutationObserver';

export { MutationRecord } from './MutationRecord';

export { ResizeObserver } from './ResizeObserver';
export type {
  ResizeObserverEntry,
  ResizeObserverSize,
  ResizeObserverOptions,
  ResizeObserverCallback,
  DOMRectReadOnly,
} from './ResizeObserver';

export { IntersectionObserver } from './IntersectionObserver';
export type {
  IntersectionObserverEntry,
  IntersectionObserverInit,
  IntersectionObserverCallback,
} from './IntersectionObserver';
