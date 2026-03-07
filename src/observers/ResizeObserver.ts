import { Node } from '../nodes/Node';

/**
 * ResizeObserverEntry — describes a single observed element's size.
 *
 * In Dixie (a CLI browser with no layout engine), all dimensions are zero.
 * This stub exists so code that references ResizeObserver doesn't throw.
 */
export interface ResizeObserverEntry {
  readonly target: Node;
  readonly contentRect: DOMRectReadOnly;
  readonly borderBoxSize: ReadonlyArray<ResizeObserverSize>;
  readonly contentBoxSize: ReadonlyArray<ResizeObserverSize>;
}

export interface ResizeObserverSize {
  readonly blockSize: number;
  readonly inlineSize: number;
}

export interface DOMRectReadOnly {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly top: number;
  readonly left: number;
  readonly bottom: number;
  readonly right: number;
}

export interface ResizeObserverOptions {
  box?: 'content-box' | 'border-box' | 'device-pixel-content-box';
}

export type ResizeObserverCallback = (
  entries: ResizeObserverEntry[],
  observer: ResizeObserver,
) => void;

/**
 * ResizeObserver — stub implementation for Dixie.
 *
 * Stores the callback and tracked targets, but never fires the callback
 * since Dixie has no layout engine. All methods are safe to call and
 * will not throw.
 */
export class ResizeObserver {
  private _callback: ResizeObserverCallback;
  private _targets: Set<Node> = new Set();

  constructor(callback: ResizeObserverCallback) {
    if (typeof callback !== 'function') {
      throw new TypeError(
        "Failed to construct 'ResizeObserver': The callback provided as parameter 1 is not a function.",
      );
    }
    this._callback = callback;
  }

  /**
   * Start observing the target element for size changes.
   * In Dixie this is a no-op beyond storing the target.
   */
  observe(target: Node, options?: ResizeObserverOptions): void {
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

  // ── Test helpers ──────────────────────────────────────────────────────

  /** Returns the number of observed targets (useful for testing). */
  get _observedCount(): number {
    return this._targets.size;
  }

  /** Returns the stored callback (useful for testing). */
  get _storedCallback(): ResizeObserverCallback {
    return this._callback;
  }
}
