import { MouseEvent } from '../events';

export function click(doc: any, selector: string): void {
  const el = doc.querySelector(selector);
  if (!el) {
    throw new Error(`click: no element matches selector "${selector}"`);
  }

  // Dispatch mousedown, mouseup, click in correct order
  el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
  el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
}
