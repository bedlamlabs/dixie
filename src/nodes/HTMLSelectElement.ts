import { Element } from './Element';
import { Node } from './Node';
import { HTMLCollection } from '../collections/HTMLCollection';
import { HTMLOptionElement } from './HTMLOptionElement';

/**
 * HTMLSelectElement — a <select> dropdown form control.
 *
 * Manages a collection of <option> children with selectedIndex and value
 * synchronization. Setting `value` updates selectedIndex to the matching
 * option, and setting `selectedIndex` updates value from that option.
 */
export class HTMLSelectElement extends Element {
  private _selectedIndex: number = -1;

  constructor() {
    super('select');
  }

  // ── options (live HTMLCollection of child <option> elements) ──────

  get options(): HTMLCollection {
    return new HTMLCollection(() =>
      this._children.filter(
        (c: Node) => c.nodeType === Node.ELEMENT_NODE && (c as Element).tagName === 'OPTION'
      )
    );
  }

  // ── selectedIndex ─────────────────────────────────────────────────

  get selectedIndex(): number {
    return this._selectedIndex;
  }

  set selectedIndex(index: number) {
    const opts = this._getOptionElements();
    // Deselect all
    for (const opt of opts) {
      opt.selected = false;
    }
    if (index >= 0 && index < opts.length) {
      this._selectedIndex = index;
      opts[index].selected = true;
    } else {
      this._selectedIndex = -1;
    }
  }

  // ── value ─────────────────────────────────────────────────────────

  get value(): string {
    const opts = this._getOptionElements();
    if (this._selectedIndex >= 0 && this._selectedIndex < opts.length) {
      return opts[this._selectedIndex].value;
    }
    return '';
  }

  set value(v: string) {
    const opts = this._getOptionElements();
    // Deselect all
    for (const opt of opts) {
      opt.selected = false;
    }
    for (let i = 0; i < opts.length; i++) {
      if (opts[i].value === v) {
        this._selectedIndex = i;
        opts[i].selected = true;
        return;
      }
    }
    // No match found
    this._selectedIndex = -1;
  }

  // ── selectedOptions ───────────────────────────────────────────────

  get selectedOptions(): HTMLOptionElement[] {
    return this._getOptionElements().filter(opt => opt.selected);
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

  // ── length ────────────────────────────────────────────────────────

  get length(): number {
    return this._getOptionElements().length;
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

  add(option: HTMLOptionElement, before?: HTMLOptionElement | number): void {
    if (before === undefined || before === null) {
      this.appendChild(option);
    } else if (typeof before === 'number') {
      const opts = this._getOptionElements();
      if (before >= 0 && before < opts.length) {
        this.insertBefore(option, opts[before]);
      } else {
        this.appendChild(option);
      }
    } else {
      this.insertBefore(option, before);
    }
  }

  remove(index: number): void {
    const opts = this._getOptionElements();
    if (index >= 0 && index < opts.length) {
      this.removeChild(opts[index]);
      // Adjust selectedIndex if necessary
      if (this._selectedIndex === index) {
        this._selectedIndex = -1;
      } else if (this._selectedIndex > index) {
        this._selectedIndex--;
      }
    }
  }

  // ── Validation ────────────────────────────────────────────────────

  checkValidity(): boolean {
    if (this.required && this._selectedIndex === -1) {
      return false;
    }
    return true;
  }

  // ── Internal helpers ──────────────────────────────────────────────

  private _getOptionElements(): HTMLOptionElement[] {
    return this._children.filter(
      (c: Node) => c.nodeType === Node.ELEMENT_NODE && (c as Element).tagName === 'OPTION'
    ) as HTMLOptionElement[];
  }
}
