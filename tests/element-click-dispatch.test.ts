/**
 * Tests for Element.click(), Element.focus(), Element.blur() dispatching real events.
 * Covers acceptance criteria 1 and 2.
 */
import { describe, it, expect, vi } from 'vitest';
import { Element, Document, MouseEvent, FocusEvent } from '../src';

// Helper to create a document with elements
function createDoc(html: string): Document {
  const doc = new Document();
  doc.body.innerHTML = html;
  return doc;
}

describe('Element.click() dispatches real MouseEvents', () => {
  it('dispatches mousedown event with bubbles:true', () => {
    const doc = createDoc('<button id="btn">Click me</button>');
    const btn = doc.getElementById('btn')!;
    const handler = vi.fn();
    btn.addEventListener('mousedown', handler);

    btn.click();

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0];
    expect(event).toBeInstanceOf(MouseEvent);
    expect(event.type).toBe('mousedown');
    expect(event.bubbles).toBe(true);
    expect(event.cancelable).toBe(true);
  });

  it('dispatches mouseup event with bubbles:true', () => {
    const doc = createDoc('<button id="btn">Click me</button>');
    const btn = doc.getElementById('btn')!;
    const handler = vi.fn();
    btn.addEventListener('mouseup', handler);

    btn.click();

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0];
    expect(event).toBeInstanceOf(MouseEvent);
    expect(event.type).toBe('mouseup');
    expect(event.bubbles).toBe(true);
    expect(event.cancelable).toBe(true);
  });

  it('dispatches click event with bubbles:true', () => {
    const doc = createDoc('<button id="btn">Click me</button>');
    const btn = doc.getElementById('btn')!;
    const handler = vi.fn();
    btn.addEventListener('click', handler);

    btn.click();

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0];
    expect(event).toBeInstanceOf(MouseEvent);
    expect(event.type).toBe('click');
    expect(event.bubbles).toBe(true);
    expect(event.cancelable).toBe(true);
  });

  it('dispatches events in correct order: mousedown -> mouseup -> click', () => {
    const doc = createDoc('<div id="target">Test</div>');
    const el = doc.getElementById('target')!;
    const order: string[] = [];

    el.addEventListener('mousedown', () => order.push('mousedown'));
    el.addEventListener('mouseup', () => order.push('mouseup'));
    el.addEventListener('click', () => order.push('click'));

    el.click();

    expect(order).toEqual(['mousedown', 'mouseup', 'click']);
  });

  it('click events bubble to parent elements', () => {
    const doc = createDoc('<div id="parent"><span id="child">Text</span></div>');
    const parent = doc.getElementById('parent')!;
    const child = doc.getElementById('child')!;
    const parentHandler = vi.fn();
    parent.addEventListener('click', parentHandler);

    child.click();

    expect(parentHandler).toHaveBeenCalledTimes(1);
  });

  it('works on non-button elements (div, span, tr)', () => {
    const doc = createDoc('<table><tr id="row"><td>Data</td></tr></table>');
    const row = doc.querySelector('#row')!;
    const handler = vi.fn();
    row.addEventListener('click', handler);

    row.click();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
  });

  it('works on anchor elements', () => {
    const doc = createDoc('<a id="link" href="/test">Link</a>');
    const link = doc.getElementById('link')!;
    const handler = vi.fn();
    link.addEventListener('click', handler);

    link.click();

    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('Element.focus() dispatches FocusEvent', () => {
  it('dispatches focus event', () => {
    const doc = createDoc('<input id="input" type="text" />');
    const input = doc.getElementById('input')!;
    const handler = vi.fn();
    input.addEventListener('focus', handler);

    input.focus();

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0];
    expect(event).toBeInstanceOf(FocusEvent);
    expect(event.type).toBe('focus');
  });

  it('focus event does NOT bubble (per DOM spec)', () => {
    const doc = createDoc('<div id="parent"><input id="input" type="text" /></div>');
    const parent = doc.getElementById('parent')!;
    const input = doc.getElementById('input')!;
    const parentHandler = vi.fn();
    parent.addEventListener('focus', parentHandler);

    input.focus();

    expect(parentHandler).not.toHaveBeenCalled();
  });

  it('sets ownerDocument.activeElement to focused element', () => {
    const doc = createDoc('<input id="input" type="text" />');
    const input = doc.getElementById('input')!;

    input.focus();

    expect(doc.activeElement).toBe(input);
  });
});

describe('Element.blur() dispatches FocusEvent', () => {
  it('dispatches blur event', () => {
    const doc = createDoc('<input id="input" type="text" />');
    const input = doc.getElementById('input')!;
    const handler = vi.fn();
    input.addEventListener('blur', handler);

    input.focus(); // focus first
    input.blur();

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0];
    expect(event).toBeInstanceOf(FocusEvent);
    expect(event.type).toBe('blur');
  });

  it('blur event does NOT bubble (per DOM spec)', () => {
    const doc = createDoc('<div id="parent"><input id="input" type="text" /></div>');
    const parent = doc.getElementById('parent')!;
    const input = doc.getElementById('input')!;
    const parentHandler = vi.fn();
    parent.addEventListener('blur', parentHandler);

    input.focus();
    input.blur();

    expect(parentHandler).not.toHaveBeenCalled();
  });

  it('clears ownerDocument.activeElement when blurred', () => {
    const doc = createDoc('<input id="input" type="text" />');
    const input = doc.getElementById('input')!;

    input.focus();
    expect(doc.activeElement).toBe(input);

    input.blur();
    expect(doc.activeElement).not.toBe(input);
  });
});
