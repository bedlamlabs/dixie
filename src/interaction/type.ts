import { InputEvent, KeyboardEvent, Event } from '../events';

export interface TypeOptions {
  clear?: boolean;
}

export function type(doc: any, selector: string, text: string, options?: TypeOptions): void {
  const el = doc.querySelector(selector);
  if (!el) {
    throw new Error(`type: no element matches selector "${selector}"`);
  }

  const tag = el.tagName?.toLowerCase();
  if (tag !== 'input' && tag !== 'textarea') {
    throw new Error(`type: target must be an input or textarea, got "${tag}"`);
  }

  // Clear existing value if requested
  if (options?.clear) {
    el.value = '';
  }

  // Type each character with full event sequence: keydown → input → keyup
  for (const char of text) {
    // 1. keydown
    el.dispatchEvent(new KeyboardEvent('keydown', {
      key: char,
      code: 'Key' + char.toUpperCase(),
      bubbles: true,
    }));

    // 2. Update value
    el.value = (el.value ?? '') + char;

    // 3. input
    el.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      cancelable: false,
      data: char,
      inputType: 'insertText',
    }));

    // 4. keyup
    el.dispatchEvent(new KeyboardEvent('keyup', {
      key: char,
      code: 'Key' + char.toUpperCase(),
      bubbles: true,
    }));
  }

  // 5. change event fires once at the end
  el.dispatchEvent(new Event('change', { bubbles: true }));
}
