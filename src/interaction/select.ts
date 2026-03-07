import { Event } from '../events';

export function select(doc: any, selector: string, value: string | { text: string }): void {
  const el = doc.querySelector(selector);
  if (!el) {
    throw new Error(`select: no element matches selector "${selector}"`);
  }

  const options = el.querySelectorAll('option');
  let found = false;

  if (typeof value === 'string') {
    // Select by value attribute
    for (const opt of options) {
      if (opt.getAttribute('value') === value) {
        el.value = value;
        found = true;
        break;
      }
    }
  } else {
    // Select by visible text
    for (const opt of options) {
      const text = (opt.textContent ?? '').trim();
      if (text === value.text) {
        el.value = opt.getAttribute('value') ?? '';
        found = true;
        break;
      }
    }
  }

  if (!found) {
    const target = typeof value === 'string' ? value : value.text;
    throw new Error(`select: no option matches "${target}" in "${selector}"`);
  }

  // Dispatch change event
  el.dispatchEvent(new Event('change', { bubbles: true }));
}
