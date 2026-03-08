/**
 * 508f.agent-api.test.ts — Agent API Primitives
 *
 * AC 6: waitForSettle() resolves on quiescence
 * AC 7: type() dispatches keydown, input, keyup, change per character
 * AC 8: action/result model returns structured result
 *
 * Tests go in dixie-standalone/tests/ during /do
 */
import { describe, it, expect } from 'vitest';

// ── AC 6: waitForSettle ────────────────────────────────────────────
describe('waitForSettle', () => {
  it('exports waitForSettle function', async () => {
    const mod = await import('../src/interaction/waitForSettle');
    expect(typeof mod.waitForSettle).toBe('function');
  });

  it('resolves when DOM is quiescent (no pending mutations)', async () => {
    const { waitForSettle } = await import('../src/interaction/waitForSettle');
    const { Document } = await import('../src/nodes/Document');

    const doc = new Document();
    doc.body.innerHTML = '<div>Static content</div>';

    // No mutations happening — should resolve quickly
    await expect(waitForSettle(doc, { timeout: 1000 })).resolves.toBeUndefined();
  });

  it('waits for mutations to settle before resolving', async () => {
    const { waitForSettle } = await import('../src/interaction/waitForSettle');
    const { Document } = await import('../src/nodes/Document');

    const doc = new Document();
    doc.body.innerHTML = '<div id="target">Initial</div>';

    // Schedule a mutation
    const startTime = Date.now();
    setTimeout(() => {
      const target = doc.querySelector('#target');
      if (target) target.textContent = 'Changed';
    }, 50);

    await waitForSettle(doc, { timeout: 5000, stableMs: 100 });
    const elapsed = Date.now() - startTime;

    // Must have waited for the mutation + stable period
    expect(elapsed).toBeGreaterThanOrEqual(100);
  });

  it('rejects on timeout if DOM never settles', async () => {
    const { waitForSettle } = await import('../src/interaction/waitForSettle');
    const { Document } = await import('../src/nodes/Document');

    const doc = new Document();

    // Continuously mutate
    const interval = setInterval(() => {
      doc.body.innerHTML = `<p>${Date.now()}</p>`;
    }, 20);

    try {
      await expect(waitForSettle(doc, { timeout: 200 })).rejects.toThrow(/timeout/i);
    } finally {
      clearInterval(interval);
    }
  });
});

// ── AC 7: type() with keyboard events ──────────────────────────────
describe('type() keyboard and change events', () => {
  it('dispatches keydown event per character', async () => {
    const { type } = await import('../src/interaction/type');
    const { Document } = await import('../src/nodes/Document');

    const doc = new Document();
    doc.body.innerHTML = '<input id="name" type="text" />';
    const input = doc.querySelector('#name')!;

    const keydownEvents: string[] = [];
    input.addEventListener('keydown', (e: any) => {
      keydownEvents.push(e.key);
    });

    type(doc, '#name', 'Hi');

    expect(keydownEvents).toEqual(['H', 'i']);
  });

  it('dispatches keyup event per character', async () => {
    const { type } = await import('../src/interaction/type');
    const { Document } = await import('../src/nodes/Document');

    const doc = new Document();
    doc.body.innerHTML = '<input id="name" type="text" />';
    const input = doc.querySelector('#name')!;

    const keyupEvents: string[] = [];
    input.addEventListener('keyup', (e: any) => {
      keyupEvents.push(e.key);
    });

    type(doc, '#name', 'Hi');

    expect(keyupEvents).toEqual(['H', 'i']);
  });

  it('dispatches input event between keydown and keyup per character', async () => {
    const { type } = await import('../src/interaction/type');
    const { Document } = await import('../src/nodes/Document');

    const doc = new Document();
    doc.body.innerHTML = '<input id="field" type="text" />';
    const input = doc.querySelector('#field')!;

    const eventLog: Array<{ type: string; data?: string }> = [];
    input.addEventListener('keydown', (e: any) => eventLog.push({ type: 'keydown', data: e.key }));
    input.addEventListener('input', (e: any) => eventLog.push({ type: 'input', data: e.data }));
    input.addEventListener('keyup', (e: any) => eventLog.push({ type: 'keyup', data: e.key }));

    type(doc, '#field', 'AB');

    // v4: full event sequence per character (keydown → input → keyup)
    expect(eventLog[0]).toEqual({ type: 'keydown', data: 'A' });
    expect(eventLog[1]).toEqual({ type: 'input', data: 'A' });
    expect(eventLog[2]).toEqual({ type: 'keyup', data: 'A' });
    expect(eventLog[3]).toEqual({ type: 'keydown', data: 'B' });
    expect(eventLog[4]).toEqual({ type: 'input', data: 'B' });
    expect(eventLog[5]).toEqual({ type: 'keyup', data: 'B' });
  });

  it('dispatches change event after full text entry', async () => {
    const { type } = await import('../src/interaction/type');
    const { Document } = await import('../src/nodes/Document');

    const doc = new Document();
    doc.body.innerHTML = '<input id="email" type="text" />';
    const input = doc.querySelector('#email')!;

    let changeCount = 0;
    input.addEventListener('change', () => {
      changeCount++;
    });

    type(doc, '#email', 'test@example.com');

    // Change fires once at the end, not per character
    expect(changeCount).toBe(1);
  });

  it('event order is keydown → input → keyup per character', async () => {
    const { type } = await import('../src/interaction/type');
    const { Document } = await import('../src/nodes/Document');

    const doc = new Document();
    doc.body.innerHTML = '<input id="order" type="text" />';
    const input = doc.querySelector('#order')!;

    const eventLog: string[] = [];
    input.addEventListener('keydown', () => eventLog.push('keydown'));
    input.addEventListener('input', () => eventLog.push('input'));
    input.addEventListener('keyup', () => eventLog.push('keyup'));
    input.addEventListener('change', () => eventLog.push('change'));

    type(doc, '#order', 'X');

    // Per character: keydown → input → keyup. Then change at end.
    expect(eventLog).toEqual(['keydown', 'input', 'keyup', 'change']);
  });

  it('dispatches change event exactly once after full text entry', async () => {
    const { type } = await import('../src/interaction/type');
    const { Document } = await import('../src/nodes/Document');

    const doc = new Document();
    doc.body.innerHTML = '<input id="progressive" type="text" />';
    const input = doc.querySelector('#progressive')!;

    const allEvents: string[] = [];
    input.addEventListener('keydown', () => allEvents.push('keydown'));
    input.addEventListener('input', () => allEvents.push('input'));
    input.addEventListener('keyup', () => allEvents.push('keyup'));
    input.addEventListener('change', () => allEvents.push('change'));

    type(doc, '#progressive', 'ABC');

    // v4: change fires exactly once, at the end after all keydown/input/keyup cycles
    const changeEvents = allEvents.filter(e => e === 'change');
    expect(changeEvents).toHaveLength(1);
    expect(allEvents[allEvents.length - 1]).toBe('change');
  });

  it('dispatches keydown events on textarea elements', async () => {
    const { type } = await import('../src/interaction/type');
    const { Document } = await import('../src/nodes/Document');

    const doc = new Document();
    doc.body.innerHTML = '<textarea id="notes"></textarea>';
    const ta = doc.querySelector('#notes')!;

    const keydownKeys: string[] = [];
    ta.addEventListener('keydown', (e: any) => keydownKeys.push(e.key));

    type(doc, '#notes', 'Hello');

    // v4: keydown events must fire on textarea too
    expect(keydownKeys).toEqual(['H', 'e', 'l', 'l', 'o']);
    expect((ta as any).value).toBe('Hello');
  });
});

// ── AC 8: Action/result model ──────────────────────────────────────
describe('action/result model', () => {
  it('exports action function', async () => {
    const mod = await import('../src/interaction/action');
    expect(typeof mod.action).toBe('function');
  });

  it('click action returns structured result', async () => {
    const { action } = await import('../src/interaction/action');
    const { Document } = await import('../src/nodes/Document');

    const doc = new Document();
    doc.body.innerHTML = '<button id="btn">Click me</button>';

    const result = await action(doc, 'click', '#btn');

    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('mutations');
    expect(result).toHaveProperty('networkCalls');
    expect(result).toHaveProperty('errors');
    expect(result).toHaveProperty('duration');
    expect(result.success).toBe(true);
    expect(typeof result.duration).toBe('number');
  });

  it('action on missing element returns success: false', async () => {
    const { action } = await import('../src/interaction/action');
    const { Document } = await import('../src/nodes/Document');

    const doc = new Document();
    doc.body.innerHTML = '<p>No button here</p>';

    const result = await action(doc, 'click', '#nonexistent');

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('type action returns mutations caused by typing', async () => {
    const { action } = await import('../src/interaction/action');
    const { Document } = await import('../src/nodes/Document');

    const doc = new Document();
    doc.body.innerHTML = '<input id="search" type="text" />';

    const result = await action(doc, 'type', '#search', { text: 'hello' });

    expect(result.success).toBe(true);
    // Typing causes value changes which are observable mutations
    expect(Array.isArray(result.mutations)).toBe(true);
  });

  it('action result includes duration in milliseconds', async () => {
    const { action } = await import('../src/interaction/action');
    const { Document } = await import('../src/nodes/Document');

    const doc = new Document();
    doc.body.innerHTML = '<button id="btn">OK</button>';

    const result = await action(doc, 'click', '#btn');

    expect(result.duration).toBeGreaterThanOrEqual(0);
    expect(result.duration).toBeLessThan(5000); // should be fast
  });
});
