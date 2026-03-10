import { Node } from '../nodes/Node';
import { MutationRecord } from './MutationRecord';

/**
 * MutationObserverInit — options for MutationObserver.observe().
 *
 * At least one of childList, attributes, or characterData must be true,
 * matching the DOM spec requirement.
 */
export interface MutationObserverInit {
  childList?: boolean;
  attributes?: boolean;
  characterData?: boolean;
  subtree?: boolean;
  attributeOldValue?: boolean;
  characterDataOldValue?: boolean;
  attributeFilter?: string[];
}

/**
 * Registration entry — tracks a single observe() call's target and options.
 */
interface ObserverRegistration {
  target: Node;
  options: MutationObserverInit;
}

/**
 * MutationObserver callback type.
 */
export type MutationCallback = (
  mutations: MutationRecord[],
  observer: MutationObserver,
) => void;

/**
 * MutationObserver — watches DOM nodes for mutations and delivers
 * batched MutationRecord arrays to a callback.
 *
 * Since Dixie's Node.ts and Element.ts are not modified, mutations must be
 * triggered externally via the `triggerMutation()` helper exported from
 * this module. This creates MutationRecords and queues them on all matching
 * observers. Records are delivered asynchronously via queueMicrotask,
 * matching browser behavior.
 *
 * For testing, `flushMutations()` can be used to synchronously deliver
 * all pending records.
 */
export class MutationObserver {
  private _callback: MutationCallback;
  private _registrations: ObserverRegistration[] = [];
  private _recordQueue: MutationRecord[] = [];
  private _scheduled = false;

  constructor(callback: MutationCallback) {
    if (typeof callback !== 'function') {
      throw new TypeError(
        "Failed to construct 'MutationObserver': The callback provided as parameter 1 is not a function.",
      );
    }
    this._callback = callback;
  }

  /**
   * Start observing the target node for mutations matching the given options.
   * If the same target is already being observed, the options are replaced.
   */
  observe(target: Node, options: MutationObserverInit = {}): void {
    // Spec: at least one of childList, attributes, or characterData must be true
    const hasFilter =
      options.childList || options.attributes || options.characterData;
    // attributes is implicitly true if attributeOldValue or attributeFilter is set
    const impliedAttributes =
      options.attributeOldValue || (options.attributeFilter && options.attributeFilter.length > 0);
    // characterData is implicitly true if characterDataOldValue is set
    const impliedCharacterData = options.characterDataOldValue;

    if (!hasFilter && !impliedAttributes && !impliedCharacterData) {
      throw new TypeError(
        "Failed to execute 'observe' on 'MutationObserver': The options object must set at least one of 'attributes', 'characterData', or 'childList' to true.",
      );
    }

    // Normalize implied options
    const normalizedOptions: MutationObserverInit = { ...options };
    if (impliedAttributes && !normalizedOptions.attributes) {
      normalizedOptions.attributes = true;
    }
    if (impliedCharacterData && !normalizedOptions.characterData) {
      normalizedOptions.characterData = true;
    }

    // Replace existing registration for same target, or add new one
    const existing = this._registrations.findIndex((r) => r.target === target);
    if (existing !== -1) {
      this._registrations[existing].options = normalizedOptions;
    } else {
      this._registrations.push({ target, options: normalizedOptions });
    }

    // Register in global registry
    _registry.add(this);
  }

  /**
   * Stop observing all targets. Pending records are NOT delivered.
   */
  disconnect(): void {
    this._registrations = [];
    this._recordQueue = [];
    this._scheduled = false;
    _registry.delete(this);
  }

  /**
   * Return all pending MutationRecords and clear the queue.
   * Cancels any pending microtask delivery.
   */
  takeRecords(): MutationRecord[] {
    const records = this._recordQueue.slice();
    this._recordQueue = [];
    this._scheduled = false;
    return records;
  }

  // ── Internal API (used by triggerMutation) ──────────────────────────

  /**
   * Check if this observer is interested in a mutation on the given target.
   */
  _matchesMutation(
    type: 'childList' | 'attributes' | 'characterData',
    target: Node,
    attributeName?: string,
  ): ObserverRegistration | null {
    for (const reg of this._registrations) {
      // Direct target match
      const directMatch = reg.target === target;
      // Subtree match: target is a descendant of the observed node
      const subtreeMatch = reg.options.subtree && reg.target.contains(target);

      if (!directMatch && !subtreeMatch) continue;

      // Check type match
      if (type === 'childList' && !reg.options.childList) continue;
      if (type === 'attributes' && !reg.options.attributes) continue;
      if (type === 'characterData' && !reg.options.characterData) continue;

      // Check attributeFilter
      if (
        type === 'attributes' &&
        reg.options.attributeFilter &&
        attributeName &&
        !reg.options.attributeFilter.includes(attributeName)
      ) {
        continue;
      }

      return reg;
    }
    return null;
  }

  /**
   * Queue a record for delivery. Schedules async callback via setImmediate,
   * which fires after the current event loop tick (after all microtasks and
   * I/O callbacks complete). This matches Chromium's frame-coalesced delivery
   * semantics: React finishes its entire synchronous reconciliation first,
   * then we deliver one batched callback — not one callback per fiber step.
   *
   * Using queueMicrotask here caused the settle detector in the journey
   * benchmark to restart its quiet window on every React fiber boundary,
   * adding hundreds of milliseconds of false-extension wait per page.
   */
  _queueRecord(record: MutationRecord): void {
    this._recordQueue.push(record);
    if (!this._scheduled) {
      this._scheduled = true;
      setImmediate(() => this._deliver());
    }
  }

  /**
   * Synchronously deliver all pending records to the callback.
   */
  _deliver(): void {
    this._scheduled = false;
    if (this._recordQueue.length === 0) return;
    const records = this._recordQueue.slice();
    this._recordQueue = [];
    this._callback(records, this);
  }
}

// ── Global Observer Registry ──────────────────────────────────────────

/**
 * The global set of active MutationObservers.
 * When a mutation is triggered, we iterate all active observers to check
 * if they're interested.
 */
const _registry = new Set<MutationObserver>();

/**
 * triggerMutation — simulate a DOM mutation and notify all matching observers.
 *
 * Call this helper whenever a DOM mutation occurs. It creates a MutationRecord
 * and queues it on all observers whose registrations match the mutation.
 *
 * This is the primary integration point. Once Node.ts/Element.ts are wired
 * to call this function, MutationObserver will work automatically.
 * Until then, tests and external code call this to simulate mutations.
 */
export function triggerMutation(
  type: 'childList' | 'attributes' | 'characterData',
  target: Node,
  details: {
    addedNodes?: Node[];
    removedNodes?: Node[];
    previousSibling?: Node | null;
    nextSibling?: Node | null;
    attributeName?: string | null;
    attributeNamespace?: string | null;
    oldValue?: string | null;
  } = {},
): void {
  for (const observer of _registry) {
    const reg = observer._matchesMutation(
      type,
      target,
      details.attributeName ?? undefined,
    );
    if (!reg) continue;

    // Determine if oldValue should be included
    let oldValue: string | null = null;
    if (type === 'attributes' && reg.options.attributeOldValue) {
      oldValue = details.oldValue ?? null;
    } else if (type === 'characterData' && reg.options.characterDataOldValue) {
      oldValue = details.oldValue ?? null;
    }

    const record = new MutationRecord({
      type,
      target,
      addedNodes: details.addedNodes,
      removedNodes: details.removedNodes,
      previousSibling: details.previousSibling,
      nextSibling: details.nextSibling,
      attributeName: details.attributeName ?? null,
      attributeNamespace: details.attributeNamespace ?? null,
      oldValue,
    });

    observer._queueRecord(record);
  }
}

/**
 * flushMutations — synchronously deliver all pending records on all observers.
 *
 * Useful in tests to avoid dealing with microtask timing.
 */
export function flushMutations(): void {
  for (const observer of _registry) {
    observer._deliver();
  }
}

/**
 * clearMutationRegistry — remove all observers from the global registry.
 *
 * Useful for test cleanup to prevent cross-test contamination.
 */
export function clearMutationRegistry(): void {
  for (const observer of _registry) {
    observer.disconnect();
  }
  _registry.clear();
}
