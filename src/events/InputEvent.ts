/**
 * InputEvent — extends UIEvent with input-specific properties
 * per the DOM Living Standard.
 *
 * Represents text insertion, deletion, and composition events
 * on contenteditable elements and form controls.
 */

import { UIEvent, UIEventInit } from './UIEvent';

export interface InputEventInit extends UIEventInit {
  data?: string | null;
  inputType?: string;
  isComposing?: boolean;
  dataTransfer?: null;
}

export class InputEvent extends UIEvent {
  readonly data: string | null;
  readonly inputType: string;
  readonly isComposing: boolean;
  readonly dataTransfer: null;

  constructor(type: string, init?: InputEventInit) {
    super(type, init);
    this.data = init?.data ?? null;
    this.inputType = init?.inputType ?? '';
    this.isComposing = init?.isComposing ?? false;
    this.dataTransfer = null;
  }
}
