import { Node } from '../nodes/Node';

/**
 * IntersectionObserverEntry — describes a single observed element's
 * intersection with its root.
 *
 * In Dixie, all elements are considered fully visible (intersecting).
 * This stub exists so code that references IntersectionObserver doesn't throw.
 */
export interface IntersectionObserverEntry {
  readonly target: Node;
  readonly isIntersecting: boolean;
  readonly intersectionRatio: number;
  readonly boundingClientRect: Record<string, number>;
  readonly intersectionRect: Record<string, number>;
  readonly rootBounds: null;
  readonly time: number;
}

export interface IntersectionObserverInit {
  root?: Node | null;
  rootMargin?: string;
  threshold?: number | number[];
}

export type IntersectionObserverCallback = (
  entries: IntersectionObserverEntry[],
  observer: IntersectionObserver,
) => void;

/**
 * IntersectionObserver — stub implementation for Dixie.
 *
 * Stores the callback, options, and tracked targets, but never fires the
 * callback since Dixie has no layout engine or viewport. All methods are
 * safe to call and will not throw.
 */
export class IntersectionObserver {
  private _callback: IntersectionObserverCallback;
  private _options: IntersectionObserverInit;
  private _targets: Set<Node> = new Set();

  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    if (typeof callback !== 'function') {
      throw new TypeError(
        "Failed to construct 'IntersectionObserver': The callback provided as parameter 1 is not a function.",
      );
    }
    this._callback = callback;
    this._options = options ?? {};
  }

  // ── Spec properties ───────────────────────────────────────────────────

  get root(): Node | null {
    return this._options.root ?? null;
  }

  get rootMargin(): string {
    return this._options.rootMargin ?? '0px 0px 0px 0px';
  }

  get thresholds(): ReadonlyArray<number> {
    const t = this._options.threshold;
    if (t == null) return [0];
    return Array.isArray(t) ? t : [t];
  }

  // ── Methods ───────────────────────────────────────────────────────────

  /**
   * Start observing the target element for intersection changes.
   * In Dixie this is a no-op beyond storing the target.
   */
  observe(target: Node): void {
    this._targets.add(target);
  }

  /**
   * Stop observing the target element.
   */
  unobserve(target: Node): void {
    this._targets.delete(target);
  }

  /**
   * Stop observing all targets.
   */
  disconnect(): void {
    this._targets.clear();
  }

  /**
   * Return pending entries. In Dixie, there are never pending entries.
   */
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  // ── Test helpers ──────────────────────────────────────────────────────

  /** Returns the number of observed targets (useful for testing). */
  get _observedCount(): number {
    return this._targets.size;
  }

  /** Returns the stored callback (useful for testing). */
  get _storedCallback(): IntersectionObserverCallback {
    return this._callback;
  }
}
