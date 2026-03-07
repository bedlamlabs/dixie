/**
 * KeyboardEvent — extends UIEvent with keyboard-specific properties
 * per the DOM Living Standard.
 */

import { UIEvent, UIEventInit } from './UIEvent';

export interface KeyboardEventInit extends UIEventInit {
  key?: string;
  code?: string;
  location?: number;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  repeat?: boolean;
  isComposing?: boolean;
}

export class KeyboardEvent extends UIEvent {
  // Location constants (per spec)
  static readonly DOM_KEY_LOCATION_STANDARD = 0;
  static readonly DOM_KEY_LOCATION_LEFT = 1;
  static readonly DOM_KEY_LOCATION_RIGHT = 2;
  static readonly DOM_KEY_LOCATION_NUMPAD = 3;

  readonly key: string;
  readonly code: string;
  readonly location: number;
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
  readonly repeat: boolean;
  readonly isComposing: boolean;

  constructor(type: string, init?: KeyboardEventInit) {
    super(type, init);
    this.key = init?.key ?? '';
    this.code = init?.code ?? '';
    this.location = init?.location ?? 0;
    this.altKey = init?.altKey ?? false;
    this.ctrlKey = init?.ctrlKey ?? false;
    this.metaKey = init?.metaKey ?? false;
    this.shiftKey = init?.shiftKey ?? false;
    this.repeat = init?.repeat ?? false;
    this.isComposing = init?.isComposing ?? false;
  }

  /**
   * Returns true if the specified modifier key was active during the event.
   * Supports: Alt, AltGraph, Control, Meta, Shift.
   */
  getModifierState(key: string): boolean {
    switch (key) {
      case 'Alt':
      case 'AltGraph':
        return this.altKey;
      case 'Control':
        return this.ctrlKey;
      case 'Meta':
        return this.metaKey;
      case 'Shift':
        return this.shiftKey;
      default:
        return false;
    }
  }
}
