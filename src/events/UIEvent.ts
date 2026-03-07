/**
 * UIEvent — base class for all UI-related events per the DOM Living Standard.
 *
 * Provides `view` (the Window associated with the event) and `detail`
 * (a numeric value whose meaning depends on the event type).
 */

import { Event, EventInit } from './Event';

export interface UIEventInit extends EventInit {
  view?: any | null;
  detail?: number;
}

export class UIEvent extends Event {
  readonly view: any | null;
  readonly detail: number;

  constructor(type: string, init?: UIEventInit) {
    super(type, init);
    this.view = init?.view ?? null;
    this.detail = init?.detail ?? 0;
  }
}
