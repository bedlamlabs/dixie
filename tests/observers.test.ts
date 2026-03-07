import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Node } from '../src/nodes/Node';
import { Element } from '../src/nodes/Element';
import { MutationRecord } from '../src/observers/MutationRecord';
import {
  MutationObserver,
  triggerMutation,
  flushMutations,
  clearMutationRegistry,
} from '../src/observers/MutationObserver';
import { ResizeObserver } from '../src/observers/ResizeObserver';
import { IntersectionObserver } from '../src/observers/IntersectionObserver';

// ═══════════════════════════════════════════════════════════════════════
// MutationRecord
// ═══════════════════════════════════════════════════════════════════════

describe('MutationRecord', () => {
  it('creates a childList record with all fields', () => {
    const target = new Element('div');
    const added = new Element('span');
    const removed = new Element('p');
    const prevSib = new Element('a');
    const nextSib = new Element('b');

    const record = new MutationRecord({
      type: 'childList',
      target,
      addedNodes: [added],
      removedNodes: [removed],
      previousSibling: prevSib,
      nextSibling: nextSib,
    });

    expect(record.type).toBe('childList');
    expect(record.target).toBe(target);
    expect(record.addedNodes.length).toBe(1);
    expect(record.addedNodes[0]).toBe(added);
    expect(record.removedNodes.length).toBe(1);
    expect(record.removedNodes[0]).toBe(removed);
    expect(record.previousSibling).toBe(prevSib);
    expect(record.nextSibling).toBe(nextSib);
    expect(record.attributeName).toBeNull();
    expect(record.attributeNamespace).toBeNull();
    expect(record.oldValue).toBeNull();
  });

  it('creates an attributes record with oldValue', () => {
    const target = new Element('input');
    const record = new MutationRecord({
      type: 'attributes',
      target,
      attributeName: 'class',
      oldValue: 'old-class',
    });

    expect(record.type).toBe('attributes');
    expect(record.attributeName).toBe('class');
    expect(record.oldValue).toBe('old-class');
    expect(record.addedNodes.length).toBe(0);
    expect(record.removedNodes.length).toBe(0);
  });

  it('creates a characterData record', () => {
    const target = new Node(Node.TEXT_NODE, 'hello');
    const record = new MutationRecord({
      type: 'characterData',
      target,
      oldValue: 'old text',
    });

    expect(record.type).toBe('characterData');
    expect(record.target).toBe(target);
    expect(record.oldValue).toBe('old text');
  });

  it('defaults optional fields to null/empty', () => {
    const target = new Element('div');
    const record = new MutationRecord({
      type: 'childList',
      target,
    });

    expect(record.addedNodes.length).toBe(0);
    expect(record.removedNodes.length).toBe(0);
    expect(record.previousSibling).toBeNull();
    expect(record.nextSibling).toBeNull();
    expect(record.attributeName).toBeNull();
    expect(record.attributeNamespace).toBeNull();
    expect(record.oldValue).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// MutationObserver
// ═══════════════════════════════════════════════════════════════════════

describe('MutationObserver', () => {
  afterEach(() => {
    clearMutationRegistry();
  });

  describe('constructor', () => {
    it('creates with a valid callback', () => {
      const observer = new MutationObserver(() => {});
      expect(observer).toBeInstanceOf(MutationObserver);
    });

    it('throws TypeError for non-function callback', () => {
      expect(() => new MutationObserver(null as any)).toThrow(TypeError);
      expect(() => new MutationObserver('not a function' as any)).toThrow(TypeError);
    });
  });

  describe('observe()', () => {
    it('throws TypeError if no observation type is specified', () => {
      const observer = new MutationObserver(() => {});
      const target = new Element('div');

      expect(() => observer.observe(target, {})).toThrow(TypeError);
      expect(() => observer.observe(target, { subtree: true })).toThrow(TypeError);
    });

    it('accepts childList: true', () => {
      const observer = new MutationObserver(() => {});
      const target = new Element('div');
      expect(() => observer.observe(target, { childList: true })).not.toThrow();
    });

    it('accepts attributes: true', () => {
      const observer = new MutationObserver(() => {});
      const target = new Element('div');
      expect(() => observer.observe(target, { attributes: true })).not.toThrow();
    });

    it('accepts characterData: true', () => {
      const observer = new MutationObserver(() => {});
      const target = new Element('div');
      expect(() => observer.observe(target, { characterData: true })).not.toThrow();
    });

    it('implicitly enables attributes when attributeOldValue is set', () => {
      const callback = vi.fn();
      const observer = new MutationObserver(callback);
      const target = new Element('div');

      // Should not throw — attributes is implied by attributeOldValue
      expect(() => observer.observe(target, { attributeOldValue: true })).not.toThrow();

      triggerMutation('attributes', target, { attributeName: 'id', oldValue: 'old' });
      flushMutations();

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0][0][0].oldValue).toBe('old');
    });

    it('implicitly enables attributes when attributeFilter is set', () => {
      const callback = vi.fn();
      const observer = new MutationObserver(callback);
      const target = new Element('div');

      expect(() => observer.observe(target, { attributeFilter: ['class'] })).not.toThrow();

      triggerMutation('attributes', target, { attributeName: 'class' });
      flushMutations();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('implicitly enables characterData when characterDataOldValue is set', () => {
      const callback = vi.fn();
      const observer = new MutationObserver(callback);
      const target = new Node(Node.TEXT_NODE, 'text');

      expect(() => observer.observe(target, { characterDataOldValue: true })).not.toThrow();

      triggerMutation('characterData', target, { oldValue: 'old text' });
      flushMutations();

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0][0][0].oldValue).toBe('old text');
    });

    it('replaces options when observing the same target twice', () => {
      const callback = vi.fn();
      const observer = new MutationObserver(callback);
      const target = new Element('div');

      // First: watch childList only
      observer.observe(target, { childList: true });

      // Second: watch attributes only (replaces first)
      observer.observe(target, { attributes: true });

      // childList mutation should NOT be delivered
      triggerMutation('childList', target, { addedNodes: [new Element('span')] });
      flushMutations();
      expect(callback).not.toHaveBeenCalled();

      // attributes mutation SHOULD be delivered
      triggerMutation('attributes', target, { attributeName: 'id' });
      flushMutations();
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('callback delivery', () => {
    it('delivers records via triggerMutation + flushMutations', () => {
      const callback = vi.fn();
      const observer = new MutationObserver(callback);
      const target = new Element('div');
      const child = new Element('span');

      observer.observe(target, { childList: true });
      triggerMutation('childList', target, { addedNodes: [child] });
      flushMutations();

      expect(callback).toHaveBeenCalledTimes(1);
      const records = callback.mock.calls[0][0];
      expect(records).toHaveLength(1);
      expect(records[0].type).toBe('childList');
      expect(records[0].addedNodes[0]).toBe(child);
    });

    it('delivers records asynchronously via microtask', async () => {
      const callback = vi.fn();
      const observer = new MutationObserver(callback);
      const target = new Element('div');

      observer.observe(target, { childList: true });
      triggerMutation('childList', target, { addedNodes: [new Element('span')] });

      // Not delivered yet (microtask hasn't run)
      expect(callback).not.toHaveBeenCalled();

      // Wait for microtask
      await Promise.resolve();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('batches multiple mutations into one callback invocation', async () => {
      const callback = vi.fn();
      const observer = new MutationObserver(callback);
      const target = new Element('div');

      observer.observe(target, { childList: true });
      triggerMutation('childList', target, { addedNodes: [new Element('a')] });
      triggerMutation('childList', target, { addedNodes: [new Element('b')] });
      triggerMutation('childList', target, { removedNodes: [new Element('c')] });

      await Promise.resolve();

      // One callback call with 3 records
      expect(callback).toHaveBeenCalledTimes(1);
      const records = callback.mock.calls[0][0];
      expect(records).toHaveLength(3);
    });

    it('passes observer as second argument to callback', () => {
      const callback = vi.fn();
      const observer = new MutationObserver(callback);
      const target = new Element('div');

      observer.observe(target, { childList: true });
      triggerMutation('childList', target, { addedNodes: [new Element('span')] });
      flushMutations();

      expect(callback.mock.calls[0][1]).toBe(observer);
    });
  });

  describe('disconnect()', () => {
    it('stops delivery of records after disconnect', () => {
      const callback = vi.fn();
      const observer = new MutationObserver(callback);
      const target = new Element('div');

      observer.observe(target, { childList: true });
      observer.disconnect();

      triggerMutation('childList', target, { addedNodes: [new Element('span')] });
      flushMutations();

      expect(callback).not.toHaveBeenCalled();
    });

    it('clears pending records on disconnect', () => {
      const observer = new MutationObserver(() => {});
      const target = new Element('div');

      observer.observe(target, { childList: true });
      triggerMutation('childList', target, { addedNodes: [new Element('span')] });

      observer.disconnect();

      const records = observer.takeRecords();
      expect(records).toHaveLength(0);
    });
  });

  describe('takeRecords()', () => {
    it('returns pending records and clears the queue', () => {
      const callback = vi.fn();
      const observer = new MutationObserver(callback);
      const target = new Element('div');

      observer.observe(target, { childList: true });
      triggerMutation('childList', target, { addedNodes: [new Element('span')] });
      triggerMutation('childList', target, { addedNodes: [new Element('p')] });

      const records = observer.takeRecords();
      expect(records).toHaveLength(2);
      expect(records[0].type).toBe('childList');
      expect(records[1].type).toBe('childList');

      // Queue is now empty
      const empty = observer.takeRecords();
      expect(empty).toHaveLength(0);
    });

    it('prevents async delivery of taken records', async () => {
      const callback = vi.fn();
      const observer = new MutationObserver(callback);
      const target = new Element('div');

      observer.observe(target, { childList: true });
      triggerMutation('childList', target, { addedNodes: [new Element('span')] });

      // Take records before microtask fires
      observer.takeRecords();

      await Promise.resolve();

      // Callback should NOT have been called
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('attributeFilter', () => {
    it('only delivers records for filtered attributes', () => {
      const callback = vi.fn();
      const observer = new MutationObserver(callback);
      const target = new Element('div');

      observer.observe(target, {
        attributes: true,
        attributeFilter: ['class', 'id'],
      });

      // This should be delivered
      triggerMutation('attributes', target, { attributeName: 'class' });
      // This should NOT be delivered
      triggerMutation('attributes', target, { attributeName: 'style' });
      // This should be delivered
      triggerMutation('attributes', target, { attributeName: 'id' });

      flushMutations();

      expect(callback).toHaveBeenCalledTimes(1);
      const records = callback.mock.calls[0][0];
      expect(records).toHaveLength(2);
      expect(records[0].attributeName).toBe('class');
      expect(records[1].attributeName).toBe('id');
    });
  });

  describe('subtree option', () => {
    it('observes mutations on descendants when subtree is true', () => {
      const callback = vi.fn();
      const observer = new MutationObserver(callback);
      const parent = new Element('div');
      const child = new Element('span');
      parent.appendChild(child);

      observer.observe(parent, { childList: true, subtree: true });

      const grandchild = new Element('em');
      triggerMutation('childList', child, { addedNodes: [grandchild] });
      flushMutations();

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0][0][0].target).toBe(child);
    });

    it('does NOT observe descendants when subtree is false', () => {
      const callback = vi.fn();
      const observer = new MutationObserver(callback);
      const parent = new Element('div');
      const child = new Element('span');
      parent.appendChild(child);

      observer.observe(parent, { childList: true }); // subtree defaults to false/undefined

      triggerMutation('childList', child, { addedNodes: [new Element('em')] });
      flushMutations();

      expect(callback).not.toHaveBeenCalled();
    });

    it('observes attribute changes on descendants when subtree + attributes', () => {
      const callback = vi.fn();
      const observer = new MutationObserver(callback);
      const parent = new Element('div');
      const child = new Element('span');
      parent.appendChild(child);

      observer.observe(parent, { attributes: true, subtree: true });

      triggerMutation('attributes', child, { attributeName: 'class' });
      flushMutations();

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('multiple observers', () => {
    it('delivers to multiple observers on the same target', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const observer1 = new MutationObserver(callback1);
      const observer2 = new MutationObserver(callback2);
      const target = new Element('div');

      observer1.observe(target, { childList: true });
      observer2.observe(target, { childList: true });

      triggerMutation('childList', target, { addedNodes: [new Element('span')] });
      flushMutations();

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('disconnecting one observer does not affect the other', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const observer1 = new MutationObserver(callback1);
      const observer2 = new MutationObserver(callback2);
      const target = new Element('div');

      observer1.observe(target, { childList: true });
      observer2.observe(target, { childList: true });

      observer1.disconnect();

      triggerMutation('childList', target, { addedNodes: [new Element('span')] });
      flushMutations();

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });

  describe('oldValue handling', () => {
    it('includes oldValue for attributes when attributeOldValue is true', () => {
      const callback = vi.fn();
      const observer = new MutationObserver(callback);
      const target = new Element('div');

      observer.observe(target, { attributes: true, attributeOldValue: true });
      triggerMutation('attributes', target, {
        attributeName: 'class',
        oldValue: 'previous-class',
      });
      flushMutations();

      expect(callback.mock.calls[0][0][0].oldValue).toBe('previous-class');
    });

    it('does NOT include oldValue when attributeOldValue is false', () => {
      const callback = vi.fn();
      const observer = new MutationObserver(callback);
      const target = new Element('div');

      observer.observe(target, { attributes: true, attributeOldValue: false });
      triggerMutation('attributes', target, {
        attributeName: 'class',
        oldValue: 'previous-class',
      });
      flushMutations();

      expect(callback.mock.calls[0][0][0].oldValue).toBeNull();
    });

    it('includes oldValue for characterData when characterDataOldValue is true', () => {
      const callback = vi.fn();
      const observer = new MutationObserver(callback);
      const target = new Node(Node.TEXT_NODE, 'hello');

      observer.observe(target, { characterData: true, characterDataOldValue: true });
      triggerMutation('characterData', target, { oldValue: 'hello' });
      flushMutations();

      expect(callback.mock.calls[0][0][0].oldValue).toBe('hello');
    });
  });

  describe('type filtering', () => {
    it('only delivers childList records when only childList is observed', () => {
      const callback = vi.fn();
      const observer = new MutationObserver(callback);
      const target = new Element('div');

      observer.observe(target, { childList: true });

      triggerMutation('attributes', target, { attributeName: 'class' });
      triggerMutation('characterData', target, {});
      flushMutations();

      expect(callback).not.toHaveBeenCalled();
    });

    it('delivers both childList and attributes when both are observed', () => {
      const callback = vi.fn();
      const observer = new MutationObserver(callback);
      const target = new Element('div');

      observer.observe(target, { childList: true, attributes: true });

      triggerMutation('childList', target, { addedNodes: [new Element('span')] });
      triggerMutation('attributes', target, { attributeName: 'id' });
      flushMutations();

      expect(callback).toHaveBeenCalledTimes(1);
      const records = callback.mock.calls[0][0];
      expect(records).toHaveLength(2);
      expect(records[0].type).toBe('childList');
      expect(records[1].type).toBe('attributes');
    });
  });

  describe('clearMutationRegistry()', () => {
    it('disconnects all observers', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const observer1 = new MutationObserver(callback1);
      const observer2 = new MutationObserver(callback2);
      const target = new Element('div');

      observer1.observe(target, { childList: true });
      observer2.observe(target, { childList: true });

      clearMutationRegistry();

      triggerMutation('childList', target, { addedNodes: [new Element('span')] });
      flushMutations();

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// ResizeObserver
// ═══════════════════════════════════════════════════════════════════════

describe('ResizeObserver', () => {
  it('constructs without throwing', () => {
    const observer = new ResizeObserver(() => {});
    expect(observer).toBeInstanceOf(ResizeObserver);
  });

  it('throws TypeError for non-function callback', () => {
    expect(() => new ResizeObserver(null as any)).toThrow(TypeError);
  });

  it('stores the callback', () => {
    const callback = vi.fn();
    const observer = new ResizeObserver(callback);
    expect(observer._storedCallback).toBe(callback);
  });

  it('observe() does not throw', () => {
    const observer = new ResizeObserver(() => {});
    const target = new Element('div');
    expect(() => observer.observe(target)).not.toThrow();
  });

  it('observe() with options does not throw', () => {
    const observer = new ResizeObserver(() => {});
    const target = new Element('div');
    expect(() => observer.observe(target, { box: 'border-box' })).not.toThrow();
  });

  it('observe() tracks the target', () => {
    const observer = new ResizeObserver(() => {});
    const target = new Element('div');
    observer.observe(target);
    expect(observer._observedCount).toBe(1);
  });

  it('unobserve() removes the target', () => {
    const observer = new ResizeObserver(() => {});
    const target = new Element('div');
    observer.observe(target);
    observer.unobserve(target);
    expect(observer._observedCount).toBe(0);
  });

  it('unobserve() does not throw for unobserved target', () => {
    const observer = new ResizeObserver(() => {});
    const target = new Element('div');
    expect(() => observer.unobserve(target)).not.toThrow();
  });

  it('disconnect() removes all targets', () => {
    const observer = new ResizeObserver(() => {});
    observer.observe(new Element('div'));
    observer.observe(new Element('span'));
    observer.observe(new Element('p'));
    expect(observer._observedCount).toBe(3);

    observer.disconnect();
    expect(observer._observedCount).toBe(0);
  });

  it('does not fire callback (no layout engine)', async () => {
    const callback = vi.fn();
    const observer = new ResizeObserver(callback);
    observer.observe(new Element('div'));

    // Wait a tick — should NOT fire
    await Promise.resolve();
    expect(callback).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// IntersectionObserver
// ═══════════════════════════════════════════════════════════════════════

describe('IntersectionObserver', () => {
  it('constructs without throwing', () => {
    const observer = new IntersectionObserver(() => {});
    expect(observer).toBeInstanceOf(IntersectionObserver);
  });

  it('throws TypeError for non-function callback', () => {
    expect(() => new IntersectionObserver(null as any)).toThrow(TypeError);
  });

  it('stores the callback', () => {
    const callback = vi.fn();
    const observer = new IntersectionObserver(callback);
    expect(observer._storedCallback).toBe(callback);
  });

  it('accepts options in constructor', () => {
    const root = new Element('div');
    const observer = new IntersectionObserver(() => {}, {
      root,
      rootMargin: '10px',
      threshold: 0.5,
    });

    expect(observer.root).toBe(root);
    expect(observer.rootMargin).toBe('10px');
    expect(observer.thresholds).toEqual([0.5]);
  });

  it('defaults root to null', () => {
    const observer = new IntersectionObserver(() => {});
    expect(observer.root).toBeNull();
  });

  it('defaults rootMargin to "0px 0px 0px 0px"', () => {
    const observer = new IntersectionObserver(() => {});
    expect(observer.rootMargin).toBe('0px 0px 0px 0px');
  });

  it('defaults thresholds to [0]', () => {
    const observer = new IntersectionObserver(() => {});
    expect(observer.thresholds).toEqual([0]);
  });

  it('accepts array of thresholds', () => {
    const observer = new IntersectionObserver(() => {}, {
      threshold: [0, 0.25, 0.5, 0.75, 1],
    });
    expect(observer.thresholds).toEqual([0, 0.25, 0.5, 0.75, 1]);
  });

  it('observe() does not throw', () => {
    const observer = new IntersectionObserver(() => {});
    expect(() => observer.observe(new Element('div'))).not.toThrow();
  });

  it('observe() tracks the target', () => {
    const observer = new IntersectionObserver(() => {});
    observer.observe(new Element('div'));
    expect(observer._observedCount).toBe(1);
  });

  it('unobserve() removes the target', () => {
    const observer = new IntersectionObserver(() => {});
    const target = new Element('div');
    observer.observe(target);
    observer.unobserve(target);
    expect(observer._observedCount).toBe(0);
  });

  it('unobserve() does not throw for unobserved target', () => {
    const observer = new IntersectionObserver(() => {});
    expect(() => observer.unobserve(new Element('div'))).not.toThrow();
  });

  it('disconnect() removes all targets', () => {
    const observer = new IntersectionObserver(() => {});
    observer.observe(new Element('div'));
    observer.observe(new Element('span'));
    expect(observer._observedCount).toBe(2);

    observer.disconnect();
    expect(observer._observedCount).toBe(0);
  });

  it('takeRecords() returns empty array', () => {
    const observer = new IntersectionObserver(() => {});
    observer.observe(new Element('div'));
    const records = observer.takeRecords();
    expect(records).toEqual([]);
  });

  it('does not fire callback (no layout engine)', async () => {
    const callback = vi.fn();
    const observer = new IntersectionObserver(callback);
    observer.observe(new Element('div'));

    await Promise.resolve();
    expect(callback).not.toHaveBeenCalled();
  });
});
