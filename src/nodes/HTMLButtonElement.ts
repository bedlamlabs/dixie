import { Element } from './Element';
import { Node } from './Node';
import { Event } from '../events/Event';

/**
 * HTMLButtonElement — a <button> form control.
 *
 * `type` defaults to 'submit' per the HTML spec.
 */
export class HTMLButtonElement extends Element {
  constructor() {
    super('button');
  }

  // ── type ──────────────────────────────────────────────────────────

  get type(): string {
    return this.getAttribute('type') ?? 'submit';
  }

  set type(v: string) {
    this.setAttribute('type', v);
  }

  // ── value ─────────────────────────────────────────────────────────

  get value(): string {
    return this.getAttribute('value') ?? '';
  }

  set value(v: string) {
    this.setAttribute('value', v);
  }

  // ── name ──────────────────────────────────────────────────────────

  get name(): string {
    return this.getAttribute('name') ?? '';
  }

  set name(v: string) {
    this.setAttribute('name', v);
  }

  // ── disabled ──────────────────────────────────────────────────────

  get disabled(): boolean {
    return this.hasAttribute('disabled');
  }

  set disabled(v: boolean) {
    if (v) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  // ── form ──────────────────────────────────────────────────────────

  get form(): Element | null {
    let current: Node | null = this.parentNode;
    while (current) {
      if (current.nodeType === Node.ELEMENT_NODE && (current as Element).tagName === 'FORM') {
        return current as Element;
      }
      current = current.parentNode;
    }
    return null;
  }

  // ── Methods ───────────────────────────────────────────────────────

  click(): void {
    const event = new Event('click', { bubbles: true, cancelable: true });
    this.dispatchEvent(event);
  }
}
