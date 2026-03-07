/**
 * MouseEvent — extends UIEvent with mouse-specific coordinate and button
 * properties per the DOM Living Standard.
 */

import { UIEvent, UIEventInit } from './UIEvent';
import { EventTarget } from './EventTarget';

export interface MouseEventInit extends UIEventInit {
  screenX?: number;
  screenY?: number;
  clientX?: number;
  clientY?: number;
  pageX?: number;
  pageY?: number;
  offsetX?: number;
  offsetY?: number;
  movementX?: number;
  movementY?: number;
  button?: number;
  buttons?: number;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  relatedTarget?: EventTarget | null;
}

export class MouseEvent extends UIEvent {
  readonly screenX: number;
  readonly screenY: number;
  readonly clientX: number;
  readonly clientY: number;
  readonly pageX: number;
  readonly pageY: number;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly movementX: number;
  readonly movementY: number;
  readonly button: number;
  readonly buttons: number;
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
  readonly relatedTarget: EventTarget | null;

  constructor(type: string, init?: MouseEventInit) {
    super(type, init);
    this.screenX = init?.screenX ?? 0;
    this.screenY = init?.screenY ?? 0;
    this.clientX = init?.clientX ?? 0;
    this.clientY = init?.clientY ?? 0;
    this.pageX = init?.pageX ?? (init?.clientX ?? 0);
    this.pageY = init?.pageY ?? (init?.clientY ?? 0);
    this.offsetX = init?.offsetX ?? 0;
    this.offsetY = init?.offsetY ?? 0;
    this.movementX = init?.movementX ?? 0;
    this.movementY = init?.movementY ?? 0;
    this.button = init?.button ?? 0;
    this.buttons = init?.buttons ?? 0;
    this.altKey = init?.altKey ?? false;
    this.ctrlKey = init?.ctrlKey ?? false;
    this.metaKey = init?.metaKey ?? false;
    this.shiftKey = init?.shiftKey ?? false;
    this.relatedTarget = init?.relatedTarget ?? null;
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
