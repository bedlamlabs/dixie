/**
 * CustomEvent — extends Event with a `detail` property for carrying
 * arbitrary data through the event system.
 */

import { Event, EventInit } from './Event';

export interface CustomEventInit extends EventInit {
  detail?: any;
}

export class CustomEvent extends Event {
  readonly detail: any;

  constructor(type: string, init?: CustomEventInit) {
    super(type, init);
    this.detail = init !== undefined && 'detail' in (init as object) ? init!.detail : null;
  }
}
