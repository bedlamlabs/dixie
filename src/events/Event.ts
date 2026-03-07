/**
 * Event — the base event class per the DOM Living Standard.
 *
 * Implements the full property set needed for DOM event propagation:
 * type, target, currentTarget, bubbles, cancelable, composed,
 * eventPhase, timeStamp, isTrusted, and control methods
 * (preventDefault, stopPropagation, stopImmediatePropagation).
 */

export interface EventInit {
  bubbles?: boolean;
  cancelable?: boolean;
  composed?: boolean;
}

export class Event {
  // ── Phase constants ────────────────────────────────────────────────
  static readonly NONE = 0;
  static readonly CAPTURING_PHASE = 1;
  static readonly AT_TARGET = 2;
  static readonly BUBBLING_PHASE = 3;

  // Instance-level phase constants (per spec)
  readonly NONE = 0;
  readonly CAPTURING_PHASE = 1;
  readonly AT_TARGET = 2;
  readonly BUBBLING_PHASE = 3;

  // ── Readonly properties ────────────────────────────────────────────
  readonly type: string;
  readonly bubbles: boolean;
  readonly cancelable: boolean;
  readonly composed: boolean;
  readonly timeStamp: number;

  // ── Mutable during dispatch ────────────────────────────────────────
  target: EventTarget | null = null;
  currentTarget: EventTarget | null = null;
  eventPhase: number = Event.NONE;
  isTrusted: boolean = false;

  // ── Internal flags ─────────────────────────────────────────────────
  private _defaultPrevented: boolean = false;
  /** @internal */ _stopPropagation: boolean = false;
  /** @internal */ _stopImmediatePropagation: boolean = false;

  constructor(type: string, init?: EventInit) {
    this.type = type;
    this.bubbles = init?.bubbles ?? false;
    this.cancelable = init?.cancelable ?? false;
    this.composed = init?.composed ?? false;
    this.timeStamp = Date.now();
  }

  get defaultPrevented(): boolean {
    return this._defaultPrevented;
  }

  preventDefault(): void {
    if (this.cancelable) {
      this._defaultPrevented = true;
    }
  }

  stopPropagation(): void {
    this._stopPropagation = true;
  }

  stopImmediatePropagation(): void {
    this._stopPropagation = true;
    this._stopImmediatePropagation = true;
  }
}
