import { describe, it, expect, vi } from 'vitest';
import { Event, CustomEvent, EventTarget, Node, Element, Text, Document, Comment } from '../src/index';

// ═══════════════════════════════════════════════════════════════════════
// Event class
// ═══════════════════════════════════════════════════════════════════════

describe('Event', () => {
  describe('constructor', () => {
    it('sets type from first argument', () => {
      const e = new Event('click');
      expect(e.type).toBe('click');
    });

    it('defaults bubbles to false', () => {
      expect(new Event('x').bubbles).toBe(false);
    });

    it('defaults cancelable to false', () => {
      expect(new Event('x').cancelable).toBe(false);
    });

    it('defaults composed to false', () => {
      expect(new Event('x').composed).toBe(false);
    });

    it('accepts EventInit to set bubbles, cancelable, composed', () => {
      const e = new Event('click', { bubbles: true, cancelable: true, composed: true });
      expect(e.bubbles).toBe(true);
      expect(e.cancelable).toBe(true);
      expect(e.composed).toBe(true);
    });

    it('has a numeric timeStamp', () => {
      const before = Date.now();
      const e = new Event('x');
      expect(e.timeStamp).toBeGreaterThanOrEqual(before);
      expect(e.timeStamp).toBeLessThanOrEqual(Date.now());
    });

    it('defaults target and currentTarget to null', () => {
      const e = new Event('x');
      expect(e.target).toBeNull();
      expect(e.currentTarget).toBeNull();
    });

    it('defaults eventPhase to NONE (0)', () => {
      expect(new Event('x').eventPhase).toBe(0);
    });

    it('defaults isTrusted to false', () => {
      expect(new Event('x').isTrusted).toBe(false);
    });

    it('defaults defaultPrevented to false', () => {
      expect(new Event('x').defaultPrevented).toBe(false);
    });
  });

  describe('phase constants', () => {
    it('has static constants', () => {
      expect(Event.NONE).toBe(0);
      expect(Event.CAPTURING_PHASE).toBe(1);
      expect(Event.AT_TARGET).toBe(2);
      expect(Event.BUBBLING_PHASE).toBe(3);
    });

    it('has instance constants', () => {
      const e = new Event('x');
      expect(e.NONE).toBe(0);
      expect(e.CAPTURING_PHASE).toBe(1);
      expect(e.AT_TARGET).toBe(2);
      expect(e.BUBBLING_PHASE).toBe(3);
    });
  });

  describe('preventDefault', () => {
    it('sets defaultPrevented to true when cancelable', () => {
      const e = new Event('click', { cancelable: true });
      e.preventDefault();
      expect(e.defaultPrevented).toBe(true);
    });

    it('does NOT set defaultPrevented when not cancelable', () => {
      const e = new Event('click', { cancelable: false });
      e.preventDefault();
      expect(e.defaultPrevented).toBe(false);
    });
  });

  describe('stopPropagation', () => {
    it('sets internal _stopPropagation flag', () => {
      const e = new Event('x');
      e.stopPropagation();
      expect(e._stopPropagation).toBe(true);
    });

    it('does not set _stopImmediatePropagation', () => {
      const e = new Event('x');
      e.stopPropagation();
      expect(e._stopImmediatePropagation).toBe(false);
    });
  });

  describe('stopImmediatePropagation', () => {
    it('sets both stop flags', () => {
      const e = new Event('x');
      e.stopImmediatePropagation();
      expect(e._stopPropagation).toBe(true);
      expect(e._stopImmediatePropagation).toBe(true);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// CustomEvent class
// ═══════════════════════════════════════════════════════════════════════

describe('CustomEvent', () => {
  it('extends Event', () => {
    expect(new CustomEvent('foo')).toBeInstanceOf(Event);
  });

  it('defaults detail to null', () => {
    expect(new CustomEvent('foo').detail).toBeNull();
  });

  it('carries a detail property', () => {
    const data = { x: 42, y: 'hello' };
    const e = new CustomEvent('foo', { detail: data });
    expect(e.detail).toBe(data);
  });

  it('inherits bubbles/cancelable from init', () => {
    const e = new CustomEvent('foo', { bubbles: true, cancelable: true, detail: 123 });
    expect(e.bubbles).toBe(true);
    expect(e.cancelable).toBe(true);
    expect(e.detail).toBe(123);
  });

  it('detail can be any type', () => {
    expect(new CustomEvent('a', { detail: 0 }).detail).toBe(0);
    expect(new CustomEvent('a', { detail: '' }).detail).toBe('');
    expect(new CustomEvent('a', { detail: false }).detail).toBe(false);
    expect(new CustomEvent('a', { detail: undefined }).detail).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// EventTarget basics (addEventListener, removeEventListener, dispatchEvent)
// ═══════════════════════════════════════════════════════════════════════

describe('EventTarget', () => {
  describe('addEventListener / dispatchEvent basics', () => {
    it('fires a listener when matching event type is dispatched', () => {
      const target = new EventTarget();
      const fn = vi.fn();
      target.addEventListener('click', fn);
      target.dispatchEvent(new Event('click'));
      expect(fn).toHaveBeenCalledOnce();
    });

    it('does not fire listener for non-matching event type', () => {
      const target = new EventTarget();
      const fn = vi.fn();
      target.addEventListener('click', fn);
      target.dispatchEvent(new Event('mousedown'));
      expect(fn).not.toHaveBeenCalled();
    });

    it('passes the event object to the listener', () => {
      const target = new EventTarget();
      let received: Event | null = null;
      target.addEventListener('test', (e) => { received = e; });
      const event = new Event('test');
      target.dispatchEvent(event);
      expect(received).toBe(event);
    });

    it('sets event.target to the dispatched node', () => {
      const target = new EventTarget();
      let seen: EventTarget | null = null;
      target.addEventListener('x', (e) => { seen = e.target; });
      target.dispatchEvent(new Event('x'));
      expect(seen).toBe(target);
    });

    it('sets event.currentTarget during dispatch', () => {
      const target = new EventTarget();
      let seen: EventTarget | null = null;
      target.addEventListener('x', (e) => { seen = e.currentTarget; });
      target.dispatchEvent(new Event('x'));
      expect(seen).toBe(target);
    });

    it('clears currentTarget after dispatch', () => {
      const target = new EventTarget();
      const event = new Event('x');
      target.addEventListener('x', () => {});
      target.dispatchEvent(event);
      expect(event.currentTarget).toBeNull();
    });

    it('fires multiple listeners in registration order', () => {
      const target = new EventTarget();
      const order: number[] = [];
      target.addEventListener('x', () => order.push(1));
      target.addEventListener('x', () => order.push(2));
      target.addEventListener('x', () => order.push(3));
      target.dispatchEvent(new Event('x'));
      expect(order).toEqual([1, 2, 3]);
    });

    it('returns true if preventDefault was not called', () => {
      const target = new EventTarget();
      expect(target.dispatchEvent(new Event('x'))).toBe(true);
    });

    it('returns false if preventDefault was called on cancelable event', () => {
      const target = new EventTarget();
      target.addEventListener('x', (e) => e.preventDefault());
      expect(target.dispatchEvent(new Event('x', { cancelable: true }))).toBe(false);
    });

    it('returns true if preventDefault called on non-cancelable event', () => {
      const target = new EventTarget();
      target.addEventListener('x', (e) => e.preventDefault());
      expect(target.dispatchEvent(new Event('x', { cancelable: false }))).toBe(true);
    });

    it('ignores null callback in addEventListener', () => {
      const target = new EventTarget();
      expect(() => target.addEventListener('x', null)).not.toThrow();
    });

    it('ignores null callback in removeEventListener', () => {
      const target = new EventTarget();
      expect(() => target.removeEventListener('x', null)).not.toThrow();
    });
  });

  describe('removeEventListener', () => {
    it('removes a previously added listener', () => {
      const target = new EventTarget();
      const fn = vi.fn();
      target.addEventListener('x', fn);
      target.removeEventListener('x', fn);
      target.dispatchEvent(new Event('x'));
      expect(fn).not.toHaveBeenCalled();
    });

    it('does nothing if the listener was never added', () => {
      const target = new EventTarget();
      const fn = vi.fn();
      expect(() => target.removeEventListener('x', fn)).not.toThrow();
    });

    it('only removes the matching capture variant', () => {
      const target = new EventTarget();
      const fn = vi.fn();
      target.addEventListener('x', fn, true); // capture
      target.removeEventListener('x', fn, false); // bubble — wrong variant
      target.dispatchEvent(new Event('x'));
      expect(fn).toHaveBeenCalledOnce(); // capture listener still there
    });

    it('accepts boolean shorthand for options', () => {
      const target = new EventTarget();
      const fn = vi.fn();
      target.addEventListener('x', fn, true);
      target.removeEventListener('x', fn, true);
      target.dispatchEvent(new Event('x'));
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('listener deduplication', () => {
    it('adding same function + same capture flag is a no-op', () => {
      const target = new EventTarget();
      const fn = vi.fn();
      target.addEventListener('x', fn);
      target.addEventListener('x', fn); // duplicate
      target.dispatchEvent(new Event('x'));
      expect(fn).toHaveBeenCalledOnce();
    });

    it('same function but different capture flag = two listeners', () => {
      const target = new EventTarget();
      const fn = vi.fn();
      target.addEventListener('x', fn, false);
      target.addEventListener('x', fn, true);
      target.dispatchEvent(new Event('x'));
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('different functions are NOT deduplicated', () => {
      const target = new EventTarget();
      const fn1 = vi.fn();
      const fn2 = vi.fn();
      target.addEventListener('x', fn1);
      target.addEventListener('x', fn2);
      target.dispatchEvent(new Event('x'));
      expect(fn1).toHaveBeenCalledOnce();
      expect(fn2).toHaveBeenCalledOnce();
    });
  });

  describe('once option', () => {
    it('fires once then auto-removes', () => {
      const target = new EventTarget();
      const fn = vi.fn();
      target.addEventListener('x', fn, { once: true });
      target.dispatchEvent(new Event('x'));
      target.dispatchEvent(new Event('x'));
      expect(fn).toHaveBeenCalledOnce();
    });

    it('other listeners are unaffected', () => {
      const target = new EventTarget();
      const once = vi.fn();
      const persistent = vi.fn();
      target.addEventListener('x', once, { once: true });
      target.addEventListener('x', persistent);
      target.dispatchEvent(new Event('x'));
      target.dispatchEvent(new Event('x'));
      expect(once).toHaveBeenCalledOnce();
      expect(persistent).toHaveBeenCalledTimes(2);
    });
  });

  describe('handleEvent interface', () => {
    it('supports object with handleEvent method', () => {
      const target = new EventTarget();
      const handler = { handleEvent: vi.fn() };
      target.addEventListener('x', handler);
      target.dispatchEvent(new Event('x'));
      expect(handler.handleEvent).toHaveBeenCalledOnce();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Node inherits EventTarget
// ═══════════════════════════════════════════════════════════════════════

describe('Node inherits EventTarget', () => {
  it('Node instances have addEventListener', () => {
    const node = new Node(1, 'X');
    expect(typeof node.addEventListener).toBe('function');
  });

  it('Node instances have removeEventListener', () => {
    const node = new Node(1, 'X');
    expect(typeof node.removeEventListener).toBe('function');
  });

  it('Node instances have dispatchEvent', () => {
    const node = new Node(1, 'X');
    expect(typeof node.dispatchEvent).toBe('function');
  });

  it('Element is instanceof EventTarget', () => {
    expect(new Element('div')).toBeInstanceOf(EventTarget);
  });

  it('Text is instanceof EventTarget', () => {
    expect(new Text('hello')).toBeInstanceOf(EventTarget);
  });

  it('Document is instanceof EventTarget', () => {
    expect(new Document()).toBeInstanceOf(EventTarget);
  });

  it('Comment is instanceof EventTarget', () => {
    expect(new Comment('hi')).toBeInstanceOf(EventTarget);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Event propagation through DOM tree
// ═══════════════════════════════════════════════════════════════════════

describe('Event propagation', () => {
  // Helper: build a tree doc > body > div > span > text
  function buildTree() {
    const doc = new Document();
    const div = doc.createElement('div');
    const span = doc.createElement('span');
    const text = doc.createTextNode('hello');
    doc.body.appendChild(div);
    div.appendChild(span);
    span.appendChild(text);
    return { doc, body: doc.body, div, span, text, html: doc.documentElement };
  }

  describe('bubbling', () => {
    it('fires listeners on ancestors when event bubbles', () => {
      const { doc, body, div, span } = buildTree();
      const order: string[] = [];
      span.addEventListener('click', () => order.push('span'));
      div.addEventListener('click', () => order.push('div'));
      body.addEventListener('click', () => order.push('body'));
      span.dispatchEvent(new Event('click', { bubbles: true }));
      expect(order).toEqual(['span', 'div', 'body']);
    });

    it('event.target stays as the original target during bubbling', () => {
      const { div, span } = buildTree();
      let targetAtDiv: EventTarget | null = null;
      div.addEventListener('click', (e) => { targetAtDiv = e.target; });
      span.dispatchEvent(new Event('click', { bubbles: true }));
      expect(targetAtDiv).toBe(span);
    });

    it('event.currentTarget changes as event propagates', () => {
      const { div, span } = buildTree();
      const currentTargets: (EventTarget | null)[] = [];
      span.addEventListener('click', (e) => currentTargets.push(e.currentTarget));
      div.addEventListener('click', (e) => currentTargets.push(e.currentTarget));
      span.dispatchEvent(new Event('click', { bubbles: true }));
      expect(currentTargets[0]).toBe(span);
      expect(currentTargets[1]).toBe(div);
    });

    it('bubbles all the way up to document', () => {
      const { doc, span } = buildTree();
      const fn = vi.fn();
      doc.addEventListener('click', fn);
      span.dispatchEvent(new Event('click', { bubbles: true }));
      expect(fn).toHaveBeenCalledOnce();
    });
  });

  describe('non-bubbling events', () => {
    it('non-bubbling event does NOT fire on ancestors', () => {
      const { div, span } = buildTree();
      const fn = vi.fn();
      div.addEventListener('focus', fn);
      span.dispatchEvent(new Event('focus', { bubbles: false }));
      expect(fn).not.toHaveBeenCalled();
    });

    it('non-bubbling event still goes through capture phase', () => {
      const { div, span } = buildTree();
      const fn = vi.fn();
      div.addEventListener('focus', fn, { capture: true });
      span.dispatchEvent(new Event('focus', { bubbles: false }));
      expect(fn).toHaveBeenCalledOnce();
    });

    it('non-bubbling event fires at-target', () => {
      const { span } = buildTree();
      const fn = vi.fn();
      span.addEventListener('focus', fn);
      span.dispatchEvent(new Event('focus', { bubbles: false }));
      expect(fn).toHaveBeenCalledOnce();
    });
  });

  describe('capture phase', () => {
    it('capture listeners fire before bubble listeners', () => {
      const { doc, body, div, span } = buildTree();
      const order: string[] = [];
      doc.addEventListener('click', () => order.push('doc-capture'), true);
      body.addEventListener('click', () => order.push('body-capture'), true);
      div.addEventListener('click', () => order.push('div-capture'), true);
      span.addEventListener('click', () => order.push('span-target'));
      div.addEventListener('click', () => order.push('div-bubble'));
      body.addEventListener('click', () => order.push('body-bubble'));
      doc.addEventListener('click', () => order.push('doc-bubble'));
      span.dispatchEvent(new Event('click', { bubbles: true }));
      expect(order).toEqual([
        'doc-capture', 'body-capture', 'div-capture',
        'span-target',
        'div-bubble', 'body-bubble', 'doc-bubble',
      ]);
    });

    it('capture phase walks root to target', () => {
      const { doc, body, div, span } = buildTree();
      const phases: number[] = [];
      doc.addEventListener('click', (e) => phases.push(e.eventPhase), true);
      body.addEventListener('click', (e) => phases.push(e.eventPhase), true);
      div.addEventListener('click', (e) => phases.push(e.eventPhase), true);
      span.dispatchEvent(new Event('click', { bubbles: true }));
      expect(phases).toEqual([1, 1, 1]); // CAPTURING_PHASE
    });
  });

  describe('eventPhase', () => {
    it('is CAPTURING_PHASE during capture', () => {
      const { div, span } = buildTree();
      let phase = -1;
      div.addEventListener('click', (e) => { phase = e.eventPhase; }, true);
      span.dispatchEvent(new Event('click', { bubbles: true }));
      expect(phase).toBe(Event.CAPTURING_PHASE);
    });

    it('is AT_TARGET at the target', () => {
      const { span } = buildTree();
      let phase = -1;
      span.addEventListener('click', (e) => { phase = e.eventPhase; });
      span.dispatchEvent(new Event('click', { bubbles: true }));
      expect(phase).toBe(Event.AT_TARGET);
    });

    it('is BUBBLING_PHASE during bubble', () => {
      const { div, span } = buildTree();
      let phase = -1;
      div.addEventListener('click', (e) => { phase = e.eventPhase; });
      span.dispatchEvent(new Event('click', { bubbles: true }));
      expect(phase).toBe(Event.BUBBLING_PHASE);
    });

    it('is NONE after dispatch completes', () => {
      const { span } = buildTree();
      const event = new Event('click');
      span.dispatchEvent(event);
      expect(event.eventPhase).toBe(Event.NONE);
    });
  });

  describe('at-target phase fires both capture and bubble listeners', () => {
    it('both capture and non-capture listeners fire at target in registration order', () => {
      const { span } = buildTree();
      const order: string[] = [];
      span.addEventListener('click', () => order.push('bubble'), false);
      span.addEventListener('click', () => order.push('capture'), true);
      span.dispatchEvent(new Event('click', { bubbles: true }));
      // At-target: all listeners fire in registration order regardless of capture flag
      expect(order).toEqual(['bubble', 'capture']);
    });
  });

  describe('stopPropagation', () => {
    it('prevents event from reaching the next node', () => {
      const { body, div, span } = buildTree();
      const order: string[] = [];
      span.addEventListener('click', (e) => { order.push('span'); e.stopPropagation(); });
      div.addEventListener('click', () => order.push('div'));
      body.addEventListener('click', () => order.push('body'));
      span.dispatchEvent(new Event('click', { bubbles: true }));
      expect(order).toEqual(['span']);
    });

    it('remaining listeners on current node still fire', () => {
      const { span } = buildTree();
      const order: string[] = [];
      span.addEventListener('click', (e) => { order.push('first'); e.stopPropagation(); });
      span.addEventListener('click', () => order.push('second'));
      span.dispatchEvent(new Event('click', { bubbles: true }));
      expect(order).toEqual(['first', 'second']);
    });

    it('stops propagation during capture phase too', () => {
      const { body, div, span } = buildTree();
      const order: string[] = [];
      body.addEventListener('click', (e) => { order.push('body-cap'); e.stopPropagation(); }, true);
      div.addEventListener('click', () => order.push('div-cap'), true);
      span.addEventListener('click', () => order.push('span'));
      span.dispatchEvent(new Event('click', { bubbles: true }));
      expect(order).toEqual(['body-cap']);
    });
  });

  describe('stopImmediatePropagation', () => {
    it('prevents remaining listeners on current node', () => {
      const { span } = buildTree();
      const order: string[] = [];
      span.addEventListener('click', (e) => { order.push('first'); e.stopImmediatePropagation(); });
      span.addEventListener('click', () => order.push('second'));
      span.dispatchEvent(new Event('click', { bubbles: true }));
      expect(order).toEqual(['first']);
    });

    it('also prevents propagation to next nodes', () => {
      const { div, span } = buildTree();
      const order: string[] = [];
      span.addEventListener('click', (e) => { order.push('span'); e.stopImmediatePropagation(); });
      div.addEventListener('click', () => order.push('div'));
      span.dispatchEvent(new Event('click', { bubbles: true }));
      expect(order).toEqual(['span']);
    });
  });

  describe('once option with propagation', () => {
    it('once listener on ancestor fires once across dispatches', () => {
      const { div, span } = buildTree();
      const fn = vi.fn();
      div.addEventListener('click', fn, { once: true });
      span.dispatchEvent(new Event('click', { bubbles: true }));
      span.dispatchEvent(new Event('click', { bubbles: true }));
      expect(fn).toHaveBeenCalledOnce();
    });
  });

  describe('events on Text nodes', () => {
    it('Text node events bubble to parent element', () => {
      const { div, text, span } = buildTree();
      const order: string[] = [];
      span.addEventListener('click', () => order.push('span'));
      div.addEventListener('click', () => order.push('div'));
      text.dispatchEvent(new Event('click', { bubbles: true }));
      expect(order).toEqual(['span', 'div']);
    });
  });

  describe('CustomEvent through propagation', () => {
    it('detail is accessible through bubbling', () => {
      const { div, span } = buildTree();
      let receivedDetail: any = null;
      div.addEventListener('custom', (e) => { receivedDetail = (e as CustomEvent).detail; });
      span.dispatchEvent(new CustomEvent('custom', { bubbles: true, detail: { key: 'value' } }));
      expect(receivedDetail).toEqual({ key: 'value' });
    });
  });

  describe('deep tree propagation', () => {
    it('handles deeply nested trees correctly', () => {
      const doc = new Document();
      let current: Element = doc.body;
      const depth = 10;
      for (let i = 0; i < depth; i++) {
        const child = doc.createElement('div');
        current.appendChild(child);
        current = child;
      }
      const deepest = current;
      const captureOrder: string[] = [];
      const bubbleOrder: string[] = [];

      doc.addEventListener('ping', () => captureOrder.push('doc'), true);
      doc.body.addEventListener('ping', () => captureOrder.push('body'), true);
      doc.addEventListener('ping', () => bubbleOrder.push('doc'));
      doc.body.addEventListener('ping', () => bubbleOrder.push('body'));

      deepest.dispatchEvent(new Event('ping', { bubbles: true }));

      expect(captureOrder).toEqual(['doc', 'body']);
      expect(bubbleOrder).toEqual(['body', 'doc']);
    });
  });

  describe('dispatchEvent on standalone node (no parent)', () => {
    it('fires at-target listeners only', () => {
      const el = new Element('div');
      const fn = vi.fn();
      el.addEventListener('x', fn);
      el.dispatchEvent(new Event('x'));
      expect(fn).toHaveBeenCalledOnce();
    });

    it('eventPhase is AT_TARGET', () => {
      const el = new Element('div');
      let phase = -1;
      el.addEventListener('x', (e) => { phase = e.eventPhase; });
      el.dispatchEvent(new Event('x'));
      expect(phase).toBe(Event.AT_TARGET);
    });
  });

  describe('listener mutation during dispatch', () => {
    it('removing a listener during dispatch does not affect current iteration', () => {
      const target = new EventTarget();
      const fn2 = vi.fn();
      const fn1 = vi.fn(() => {
        target.removeEventListener('x', fn2);
      });
      target.addEventListener('x', fn1);
      target.addEventListener('x', fn2);
      // fn2 was in the snapshot, so it still fires this dispatch
      target.dispatchEvent(new Event('x'));
      expect(fn1).toHaveBeenCalledOnce();
      expect(fn2).toHaveBeenCalledOnce();

      // But fn2 was removed, so second dispatch doesn't fire it
      fn1.mockClear();
      fn2.mockClear();
      target.dispatchEvent(new Event('x'));
      expect(fn1).toHaveBeenCalledOnce();
      expect(fn2).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('empty string event type works', () => {
      const target = new EventTarget();
      const fn = vi.fn();
      target.addEventListener('', fn);
      target.dispatchEvent(new Event(''));
      expect(fn).toHaveBeenCalledOnce();
    });

    it('multiple event types on same target are independent', () => {
      const target = new EventTarget();
      const clickFn = vi.fn();
      const keyFn = vi.fn();
      target.addEventListener('click', clickFn);
      target.addEventListener('keydown', keyFn);
      target.dispatchEvent(new Event('click'));
      expect(clickFn).toHaveBeenCalledOnce();
      expect(keyFn).not.toHaveBeenCalled();
    });

    it('dispatchEvent on Document works', () => {
      const doc = new Document();
      const fn = vi.fn();
      doc.addEventListener('load', fn);
      doc.dispatchEvent(new Event('load'));
      expect(fn).toHaveBeenCalledOnce();
    });

    it('passive option is accepted without error', () => {
      const target = new EventTarget();
      const fn = vi.fn();
      expect(() => target.addEventListener('x', fn, { passive: true })).not.toThrow();
      target.dispatchEvent(new Event('x'));
      expect(fn).toHaveBeenCalledOnce();
    });
  });
});
