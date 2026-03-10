/**
 * React Render Flush — yield the Node.js event loop until the DOM stabilizes.
 *
 * ## Why this works
 *
 * React 18's scheduler defers DOM reconciliation via MessageChannel:
 *   port2.postMessage(null)  →  port1.onmessage fires in the next event loop turn
 *
 * The vm sandbox provides the REAL `globalThis.MessageChannel`, so React's
 * scheduled work lives in the real Node.js event loop. `vm.runInContext` returns
 * BEFORE those messages fire. We simply need to yield back to the event loop.
 *
 * `setImmediate` is ideal here — it fires after all pending I/O and message
 * callbacks, giving React (and any fetch-triggered re-renders) a full turn.
 *
 * ## Stability detection
 *
 * Instead of relying on MutationObserver (not yet wired to Dixie's DOM nodes),
 * we poll the DOM element count. When it's unchanged for `stableRounds`
 * consecutive rounds, rendering is considered complete.
 *
 * For non-SPA pages: count is stable immediately → exits in ~0ms.
 * For simple React renders (no async data): stable within 5-10 rounds (~1ms).
 * For data-loading renders: stable after network round-trips complete.
 */

export interface FlushResult {
  /** true if DOM stabilized within the timeout; false if timed out */
  stable: boolean;
  /** final element count in the document */
  elementCount: number;
  /** how many event loop rounds were needed */
  rounds: number;
}

export interface FlushOptions {
  /**
   * Max time to wait for the DOM to stabilize (ms).
   * Defaults to 3000ms.
   */
  timeoutMs?: number;
  /**
   * Number of consecutive stable rounds required before declaring done.
   * Higher values are more conservative for apps with rapid successive renders.
   * Defaults to 3.
   */
  stableRounds?: number;
  /**
   * CSS selector or element ID to wait for (in addition to stability).
   * When set, we also require this element to be present before resolving.
   * Useful for: waitForSelector('#root > *') to confirm React mounted.
   */
  waitForSelector?: string;
}

/**
 * Yield the event loop until the document's DOM has stopped changing,
 * or until `timeoutMs` is exceeded.
 *
 * Call this immediately after executing a React bundle to allow React's
 * async scheduler (MessageChannel), effects (useEffect), and data fetches
 * to complete before querying the DOM.
 */
export async function flushReactRender(
  doc: any,
  options?: FlushOptions,
): Promise<FlushResult> {
  const timeoutMs = options?.timeoutMs ?? 3000;
  const requiredStableRounds = options?.stableRounds ?? 3;
  const waitForSelector = options?.waitForSelector;
  const deadline = Date.now() + timeoutMs;

  let lastCount = -1;
  let stableCount = 0;
  let rounds = 0;
  // Track mutation version to skip expensive querySelectorAll when DOM is unchanged
  let lastMutationVersion = -1;

  while (Date.now() < deadline) {
    // Yield to the event loop — this lets MessageChannel callbacks, resolved
    // promises, fetch completions, and effect microtasks all process.
    await new Promise<void>((resolve) => setImmediate(resolve));
    rounds++;

    // Fast path: if mutation version is unchanged, DOM hasn't been touched —
    // skip the O(n) querySelectorAll and reuse the previous count.
    const currentVersion = doc._mutationVersion ?? -2;
    let count: number;
    if (currentVersion === lastMutationVersion && lastCount >= 0) {
      count = lastCount;
    } else {
      count = (doc.querySelectorAll('*') as any[]).length;
      lastMutationVersion = currentVersion;
    }

    if (count === lastCount) {
      stableCount++;

      // If a selector target is required, only count as stable when found
      if (waitForSelector) {
        const found = doc.querySelector(waitForSelector);
        if (!found) {
          // DOM is stable but target still absent — keep waiting
          stableCount = 0;
          continue;
        }
      }

      if (stableCount >= requiredStableRounds) {
        return { stable: true, elementCount: count, rounds };
      }
    } else {
      // DOM changed — reset stability counter, update baseline
      stableCount = 0;
      lastCount = count;
    }
  }

  return {
    stable: false,
    elementCount: (doc.querySelectorAll('*') as any[]).length,
    rounds,
  };
}
