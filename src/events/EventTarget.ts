/**
 * EventTarget — the mixin that provides addEventListener, removeEventListener,
 * and dispatchEvent to all DOM nodes.
 *
 * Per the DOM Living Standard:
 * - Listener deduplication: adding the same (type, callback, capture) combo
 *   twice is a no-op.
 * - `once` listeners auto-remove after first invocation.
 * - `passive` sets a flag (we track it but don't need scroll behavior).
 * - dispatchEvent builds the propagation path and walks capture → at-target → bubble.
 */

import { Event } from './Event';

export type EventListener = ((event: Event) => void) | { handleEvent(event: Event): void };

export interface AddEventListenerOptions {
  capture?: boolean;
  once?: boolean;
  passive?: boolean;
}

interface ListenerRecord {
  type: string;
  callback: EventListener;
  capture: boolean;
  once: boolean;
  passive: boolean;
}

/**
 * EventTarget is designed to be mixed into Node. It stores listeners on each
 * node instance and implements the full dispatch algorithm including
 * propagation through the DOM tree.
 */
export class EventTarget {
  /** @internal */
  _listeners: ListenerRecord[] = [];

  addEventListener(
    type: string,
    callback: EventListener | null,
    options?: AddEventListenerOptions | boolean,
  ): void {
    if (callback === null || callback === undefined) return;

    const capture = typeof options === 'boolean' ? options : (options?.capture ?? false);
    const once = typeof options === 'boolean' ? false : (options?.once ?? false);
    const passive = typeof options === 'boolean' ? false : (options?.passive ?? false);

    // Deduplication: same type + callback + capture is a no-op
    for (const record of this._listeners) {
      if (record.type === type && record.callback === callback && record.capture === capture) {
        return;
      }
    }

    this._listeners.push({ type, callback, capture, once, passive });
  }

  removeEventListener(
    type: string,
    callback: EventListener | null,
    options?: AddEventListenerOptions | boolean,
  ): void {
    if (callback === null || callback === undefined) return;

    const capture = typeof options === 'boolean' ? options : (options?.capture ?? false);

    const index = this._listeners.findIndex(
      (r) => r.type === type && r.callback === callback && r.capture === capture,
    );
    if (index !== -1) {
      this._listeners.splice(index, 1);
    }
  }

  /**
   * Dispatches an event through the DOM tree.
   *
   * 1. Build path from target to root (via parentNode chain).
   * 2. Capture phase: walk root → target, calling capture listeners.
   * 3. At-target: call both capture and bubble listeners.
   * 4. Bubble phase: walk target → root, calling bubble listeners (only if event.bubbles).
   *
   * Returns false if preventDefault() was called, true otherwise.
   */
  dispatchEvent(event: Event): boolean {
    // Set the target
    event.target = this as any;

    // Build the propagation path: [this, parent, grandparent, ..., root]
    const path: EventTarget[] = [];
    let current: any = this;
    while (current) {
      path.push(current);
      current = current.parentNode ?? null;
    }

    // Ancestors list (excluding target): [parent, grandparent, ..., root]
    const ancestors = path.slice(1);

    // ── Capture phase (root → target, excluding target) ────────────
    event.eventPhase = Event.CAPTURING_PHASE;
    for (let i = ancestors.length - 1; i >= 0; i--) {
      event.currentTarget = ancestors[i] as any;
      _invokeListeners(ancestors[i], event, /* captureOnly */ true);
      if (event._stopPropagation) break;
    }

    // ── At-target phase ────────────────────────────────────────────
    if (!event._stopPropagation) {
      event.eventPhase = Event.AT_TARGET;
      event.currentTarget = this as any;
      // At target, fire both capture and bubble listeners (in registration order)
      _invokeListeners(this, event, /* captureOnly */ null);
    }

    // ── Bubble phase (target → root, excluding target) ─────────────
    if (event.bubbles && !event._stopPropagation) {
      event.eventPhase = Event.BUBBLING_PHASE;
      for (let i = 0; i < ancestors.length; i++) {
        event.currentTarget = ancestors[i] as any;
        _invokeListeners(ancestors[i], event, /* captureOnly */ false);
        if (event._stopPropagation) break;
      }
    }

    // ── Cleanup ────────────────────────────────────────────────────
    event.currentTarget = null;
    event.eventPhase = Event.NONE;

    return !event.defaultPrevented;
  }
}

/**
 * Invoke matching listeners on a single target.
 *
 * @param target - The node whose listeners to invoke.
 * @param event - The event being dispatched.
 * @param captureOnly - true: only capture listeners; false: only bubble listeners;
 *                      null: both (at-target phase).
 */
function _invokeListeners(
  target: EventTarget,
  event: Event,
  captureOnly: boolean | null,
): void {
  // Snapshot the listener list to avoid issues with mutations during iteration
  const listeners = target._listeners.slice();

  for (const record of listeners) {
    if (record.type !== event.type) continue;

    // Filter by phase
    if (captureOnly === true && !record.capture) continue;
    if (captureOnly === false && record.capture) continue;
    // captureOnly === null means at-target: fire all listeners regardless of capture flag

    // Handle `once` — remove before invoking
    if (record.once) {
      target.removeEventListener(record.type, record.callback, { capture: record.capture });
    }

    // Invoke the listener
    if (typeof record.callback === 'function') {
      record.callback(event);
    } else if (record.callback && typeof record.callback.handleEvent === 'function') {
      record.callback.handleEvent(event);
    }

    // Check stopImmediatePropagation after each listener
    if (event._stopImmediatePropagation) break;
  }
}
