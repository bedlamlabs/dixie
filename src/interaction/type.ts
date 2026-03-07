import { InputEvent } from '../events';

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

  // Type each character, dispatching input events
  for (const char of text) {
    el.value = (el.value ?? '') + char;
    el.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      cancelable: false,
      data: char,
      inputType: 'insertText',
    }));
  }
}
