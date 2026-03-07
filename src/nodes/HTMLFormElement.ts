import { Element } from './Element';
import { Node } from './Node';
import { HTMLCollection } from '../collections/HTMLCollection';
import { Event } from '../events/Event';

// Import types for form controls — these check tagName, so no circular dep issues
const FORM_CONTROL_TAGS = new Set(['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON']);

/**
 * HTMLFormElement — a <form> element.
 *
 * Provides access to descendant form controls, submit/reset behavior,
 * and collective validation.
 */
export class HTMLFormElement extends Element {
  constructor() {
    super('form');
  }

  // ── elements (live collection of descendant form controls) ────────

  get elements(): HTMLCollection {
    return new HTMLCollection(() => this._collectFormControls());
  }

  // ── length ────────────────────────────────────────────────────────

  get length(): number {
    return this._collectFormControls().length;
  }

  // ── action ────────────────────────────────────────────────────────

  get action(): string {
    return this.getAttribute('action') ?? '';
  }

  set action(v: string) {
    this.setAttribute('action', v);
  }

  // ── method ────────────────────────────────────────────────────────

  get method(): string {
    return this.getAttribute('method') ?? 'get';
  }

  set method(v: string) {
    this.setAttribute('method', v);
  }

  // ── enctype ───────────────────────────────────────────────────────

  get enctype(): string {
    return this.getAttribute('enctype') ?? '';
  }

  set enctype(v: string) {
    this.setAttribute('enctype', v);
  }

  // ── name ──────────────────────────────────────────────────────────

  get name(): string {
    return this.getAttribute('name') ?? '';
  }

  set name(v: string) {
    this.setAttribute('name', v);
  }

  // ── Methods ───────────────────────────────────────────────────────

  submit(): void {
    const event = new Event('submit', { bubbles: true, cancelable: true });
    this.dispatchEvent(event);
  }

  reset(): void {
    const event = new Event('reset', { bubbles: true, cancelable: true });
    this.dispatchEvent(event);

    // Reset all child inputs to their default values
    const controls = this._collectFormControls();
    for (const control of controls) {
      const el = control as Element;
      if (el.tagName === 'INPUT') {
        // Reset value to defaultValue and checked to defaultChecked
        const input = el as any;
        input.value = input.defaultValue;
        input.checked = input.defaultChecked;
      } else if (el.tagName === 'TEXTAREA') {
        const textarea = el as any;
        textarea.value = textarea.defaultValue;
      } else if (el.tagName === 'SELECT') {
        const select = el as any;
        select.selectedIndex = -1;
      }
    }
  }

  checkValidity(): boolean {
    const controls = this._collectFormControls();
    for (const control of controls) {
      const el = control as any;
      if (typeof el.checkValidity === 'function') {
        if (!el.checkValidity()) {
          return false;
        }
      }
    }
    return true;
  }

  // ── Internal helpers ──────────────────────────────────────────────

  private _collectFormControls(): Node[] {
    const results: Node[] = [];
    this._walkDescendants(this, results);
    return results;
  }

  private _walkDescendants(node: Node, results: Node[]): void {
    for (const child of node._children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as Element;
        if (FORM_CONTROL_TAGS.has(el.tagName)) {
          results.push(el);
        }
      }
      this._walkDescendants(child, results);
    }
  }
}
