import { Element } from './Element';
import { Node } from './Node';

/**
 * HTMLTextAreaElement — a <textarea> form control.
 *
 * Like HTMLInputElement, `value` is internal state (not the attribute).
 * `defaultValue` maps to textContent.
 */
export class HTMLTextAreaElement extends Element {
  private _value: string = '';

  constructor() {
    super('textarea');
  }

  // ── value (internal state, NOT attribute) ─────────────────────────

  get value(): string {
    return this._value;
  }

  set value(v: string) {
    this._value = v;
  }

  // ── defaultValue (maps to textContent) ────────────────────────────

  get defaultValue(): string {
    return this.textContent;
  }

  set defaultValue(v: string) {
    this.textContent = v;
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

  // ── rows ──────────────────────────────────────────────────────────

  get rows(): number {
    const attr = this.getAttribute('rows');
    return attr !== null ? parseInt(attr, 10) : 2;
  }

  set rows(v: number) {
    this.setAttribute('rows', String(v));
  }

  // ── cols ──────────────────────────────────────────────────────────

  get cols(): number {
    const attr = this.getAttribute('cols');
    return attr !== null ? parseInt(attr, 10) : 20;
  }

  set cols(v: number) {
    this.setAttribute('cols', String(v));
  }

  // ── maxLength / minLength ─────────────────────────────────────────

  get maxLength(): number {
    const attr = this.getAttribute('maxlength');
    return attr !== null ? parseInt(attr, 10) : -1;
  }

  set maxLength(v: number) {
    this.setAttribute('maxlength', String(v));
  }

  get minLength(): number {
    const attr = this.getAttribute('minlength');
    return attr !== null ? parseInt(attr, 10) : -1;
  }

  set minLength(v: number) {
    this.setAttribute('minlength', String(v));
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

  select(): void {
    // no-op in CLI browser
  }

  focus(): void {
    super.focus();
  }

  blur(): void {
    super.blur();
  }

  protected _copyCloneState(clone: Element): void {
    (clone as HTMLTextAreaElement)._value = this._value;
  }

  // ── Validation ────────────────────────────────────────────────────

  checkValidity(): boolean {
    if (this.required && this._value === '') {
      return false;
    }
    return true;
  }
}
