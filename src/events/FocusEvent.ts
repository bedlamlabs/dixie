/**
 * FocusEvent — extends UIEvent with focus-specific properties
 * per the DOM Living Standard.
 *
 * Note: 'focus' and 'blur' do NOT bubble.
 *       'focusin' and 'focusout' DO bubble.
 */

import { UIEvent, UIEventInit } from './UIEvent';
import { EventTarget } from './EventTarget';

export interface FocusEventInit extends UIEventInit {
  relatedTarget?: EventTarget | null;
}

export class FocusEvent extends UIEvent {
  readonly relatedTarget: EventTarget | null;

  constructor(type: string, init?: FocusEventInit) {
    super(type, init);
    this.relatedTarget = init?.relatedTarget ?? null;
  }
}
