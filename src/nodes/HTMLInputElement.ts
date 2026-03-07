import { Element } from './Element';
import { Node } from './Node';
import { Event } from '../events/Event';

/**
 * HTMLInputElement — an <input> form control.
 *
 * Key browser behavior replicated:
 * - `value` is internal state, NOT the 'value' attribute (which is `defaultValue`).
 * - `checked` is internal state, NOT the 'checked' attribute (which is `defaultChecked`).
 * - `type` defaults to 'text'.
 * - Boolean attributes (disabled, readOnly, required, etc.) are presence-based.
 */
export class HTMLInputElement extends Element {
  private _value: string = '';
  private _checked: boolean = false;

  constructor() {
    super('input');
  }

  // ── type ──────────────────────────────────────────────────────────

  get type(): string {
    return this.getAttribute('type') ?? 'text';
  }

  set type(v: string) {
    this.setAttribute('type', v);
  }

  // ── value (internal state, NOT attribute) ─────────────────────────

  get value(): string {
    return this._value;
  }

  set value(v: string) {
    this._value = v;
  }

  // ── defaultValue (maps to 'value' attribute) ─────────────────────

  get defaultValue(): string {
    return this.getAttribute('value') ?? '';
  }

  set defaultValue(v: string) {
    this.setAttribute('value', v);
  }

  // ── checked (internal state, NOT attribute) ───────────────────────

  get checked(): boolean {
    return this._checked;
  }

  set checked(v: boolean) {
    this._checked = v;
  }

  // ── defaultChecked (maps to 'checked' attribute) ──────────────────

  get defaultChecked(): boolean {
    return this.hasAttribute('checked');
  }

  set defaultChecked(v: boolean) {
    if (v) {
      this.setAttribute('checked', '');
    } else {
      this.removeAttribute('checked');
    }
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

  // ── readOnly ──────────────────────────────────────────────────────

  get readOnly(): boolean {
    return this.hasAttribute('readonly');
  }

  set readOnly(v: boolean) {
    if (v) {
      this.setAttribute('readonly', '');
    } else {
      this.removeAttribute('readonly');
    }
  }

  // ── required ──────────────────────────────────────────────────────

  get required(): boolean {
    return this.hasAttribute('required');
  }

  set required(v: boolean) {
    if (v) {
      this.setAttribute('required', '');
    } else {
      this.removeAttribute('required');
    }
  }

  // ── placeholder ───────────────────────────────────────────────────

  get placeholder(): string {
    return this.getAttribute('placeholder') ?? '';
  }

  set placeholder(v: string) {
    this.setAttribute('placeholder', v);
  }

  // ── min / max / step ──────────────────────────────────────────────

  get min(): string {
    return this.getAttribute('min') ?? '';
  }

  set min(v: string) {
    this.setAttribute('min', v);
  }

  get max(): string {
    return this.getAttribute('max') ?? '';
  }

  set max(v: string) {
    this.setAttribute('max', v);
  }

  get step(): string {
    return this.getAttribute('step') ?? '';
  }

  set step(v: string) {
    this.setAttribute('step', v);
  }

  // ── minLength / maxLength ─────────────────────────────────────────

  get minLength(): number {
    const attr = this.getAttribute('minlength');
    return attr !== null ? parseInt(attr, 10) : -1;
  }

  set minLength(v: number) {
    this.setAttribute('minlength', String(v));
  }

  get maxLength(): number {
    const attr = this.getAttribute('maxlength');
    return attr !== null ? parseInt(attr, 10) : -1;
  }

  set maxLength(v: number) {
    this.setAttribute('maxlength', String(v));
  }

  // ── pattern ───────────────────────────────────────────────────────

  get pattern(): string {
    return this.getAttribute('pattern') ?? '';
  }

  set pattern(v: string) {
    this.setAttribute('pattern', v);
  }

  // ── multiple ──────────────────────────────────────────────────────

  get multiple(): boolean {
    return this.hasAttribute('multiple');
  }

  set multiple(v: boolean) {
    if (v) {
      this.setAttribute('multiple', '');
    } else {
      this.removeAttribute('multiple');
    }
  }

  // ── autofocus ─────────────────────────────────────────────────────

  get autofocus(): boolean {
    return this.hasAttribute('autofocus');
  }

  set autofocus(v: boolean) {
    if (v) {
      this.setAttribute('autofocus', '');
    } else {
      this.removeAttribute('autofocus');
    }
  }

  // ── form (walk up tree) ───────────────────────────────────────────

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

  focus(): void {
    super.focus();
  }

  blur(): void {
    super.blur();
  }

  click(): void {
    // Toggle checked for checkbox
    if (this.type === 'checkbox') {
      this._checked = !this._checked;
    }
    super.click();
  }

  select(): void {
    // no-op in CLI browser
  }

  protected _copyCloneState(clone: Element): void {
    const inputClone = clone as HTMLInputElement;
    inputClone._value = this._value;
    inputClone._checked = this._checked;
  }

  // ── Validation ────────────────────────────────────────────────────

  get validity(): { valid: boolean; valueMissing: boolean } {
    const valueMissing = this.required && this._value === '';
    return {
      valid: !valueMissing,
      valueMissing,
    };
  }

  checkValidity(): boolean {
    return this.validity.valid;
  }

  reportValidity(): boolean {
    return this.checkValidity();
  }
}
