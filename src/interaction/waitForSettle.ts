import { MutationObserver } from '../observers/MutationObserver';

export interface WaitForSettleOptions {
  timeout?: number;    // default 5000ms
  stableMs?: number;   // default 100ms — how long DOM must be quiet
}

export async function waitForSettle(
  doc: any,
  options?: WaitForSettleOptions,
): Promise<void> {
  const timeout = options?.timeout ?? 5000;
  const stableMs = options?.stableMs ?? 100;

  return new Promise<void>((resolve, reject) => {
    let lastMutationTime = Date.now();
    let settled = false;

    const timeoutId = setTimeout(() => {
      if (!settled) {
        settled = true;
        observer?.disconnect();
        clearInterval(checkInterval);
        reject(new Error(`waitForSettle timeout after ${timeout}ms`));
      }
    }, timeout);

    // Watch for mutations
    let observer: MutationObserver | undefined;
    try {
      observer = new MutationObserver(() => {
        lastMutationTime = Date.now();
      });
      const observeTarget = doc.body ?? doc;
      observer.observe(observeTarget, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });
    } catch {
      // No MutationObserver available — just wait stableMs
    }

    // Poll for stability
    const checkInterval = setInterval(() => {
      if (settled) {
        clearInterval(checkInterval);
        return;
      }

      const elapsed = Date.now() - lastMutationTime;
      if (elapsed >= stableMs) {
        settled = true;
        clearTimeout(timeoutId);
        clearInterval(checkInterval);
        observer?.disconnect();
        resolve();
      }
    }, Math.min(stableMs / 2, 50));
  });
}
