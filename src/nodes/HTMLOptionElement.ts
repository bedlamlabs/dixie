import { Element } from './Element';
import { Node } from './Node';

/**
 * HTMLOptionElement — an <option> element within a <select>.
 *
 * `value` falls back to textContent when no 'value' attribute is set.
 * `selected` is internal state (not attribute-driven after user interaction).
 * `index` reflects position within the parent <select>'s options.
 */
export class HTMLOptionElement extends Element {
  private _selected: boolean = false;

  constructor() {
    super('option');
  }

  // ── value ─────────────────────────────────────────────────────────

  get value(): string {
    const attr = this.getAttribute('value');
    return attr !== null ? attr : this.textContent;
  }

  set value(v: string) {
    this.setAttribute('value', v);
  }

  // ── text ──────────────────────────────────────────────────────────

  get text(): string {
    return this.textContent;
  }

  set text(v: string) {
    this.textContent = v;
  }

  // ── selected ──────────────────────────────────────────────────────

  get selected(): boolean {
    return this._selected;
  }

  set selected(v: boolean) {
    this._selected = v;
  }

  // ── defaultSelected ───────────────────────────────────────────────

  get defaultSelected(): boolean {
    return this.hasAttribute('selected');
  }

  set defaultSelected(v: boolean) {
    if (v) {
      this.setAttribute('selected', '');
    } else {
      this.removeAttribute('selected');
    }
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

  // ── index ─────────────────────────────────────────────────────────

  get index(): number {
    const parent = this.parentNode;
    if (parent && (parent as any).tagName === 'SELECT') {
      const options = (parent as Element)._children.filter(
        (c: Node) => c.nodeType === Node.ELEMENT_NODE && (c as Element).tagName === 'OPTION'
      );
      return options.indexOf(this);
    }
    return 0;
  }

  // ── label ─────────────────────────────────────────────────────────

  get label(): string {
    const attr = this.getAttribute('label');
    return attr !== null ? attr : this.text;
  }

  set label(v: string) {
    this.setAttribute('label', v);
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
}
