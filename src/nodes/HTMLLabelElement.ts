import { Element } from './Element';
import { Node } from './Node';

/**
 * HTMLLabelElement — a <label> element.
 *
 * `htmlFor` maps to the 'for' attribute.
 * `control` finds the element with matching ID in the same document.
 */
export class HTMLLabelElement extends Element {
  constructor() {
    super('label');
  }

  // ── htmlFor (maps to 'for' attribute) ─────────────────────────────

  get htmlFor(): string {
    return this.getAttribute('for') ?? '';
  }

  set htmlFor(v: string) {
    this.setAttribute('for', v);
  }

  // ── control ───────────────────────────────────────────────────────

  get control(): Element | null {
    const forId = this.htmlFor;
    if (!forId) return null;

    // Walk up to find the document root, then search by ID
    const doc = this.ownerDocument;
    if (doc && typeof doc.getElementById === 'function') {
      return doc.getElementById(forId);
    }
    return null;
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
