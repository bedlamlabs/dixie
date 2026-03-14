/**
 * 5edd DOM Tests — removeChild MutationObserver + getByLabel exact matching
 */
import { describe, it, expect } from 'vitest';

describe('5edd: removeChild — MutationObserver fires', () => {
  it('fires MutationObserver callback with removedNodes when removeChild is called', async () => {
    const { Document } = await import('./nodes/Document');
    const { MutationObserver, flushMutations } = await import('./observers/MutationObserver');
    const doc = new Document();
    const parent = doc.createElement('div');
    const child = doc.createElement('span');
    parent.appendChild(child);
    doc.body.appendChild(parent);
    let observerFired = false;
    let removedNodes: any[] = [];
    const observer = new MutationObserver((mutations: any[]) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.removedNodes?.length > 0) {
          observerFired = true;
          removedNodes = [...mutation.removedNodes];
        }
      }
    });
    observer.observe(parent, { childList: true });
    parent.removeChild(child);
    // Delivery is async (setImmediate) — flush synchronously for test
    flushMutations();
    expect(observerFired).toBe(true);
    expect(removedNodes).toHaveLength(1);
    expect(removedNodes[0]).toBe(child);
  });
});

describe('5edd: getByLabel — exact matching (label text path)', () => {
  it('exact match: "Submit" does NOT match label with text "Submit Button"', async () => {
    const { Document } = await import('./nodes/Document');
    const { getByLabel } = await import('./queries/label');
    const doc = new Document();
    const label = doc.createElement('label');
    label.setAttribute('for', 'btn');
    label.textContent = 'Submit Button';
    const input = doc.createElement('input');
    input.setAttribute('id', 'btn');
    doc.body.appendChild(label);
    doc.body.appendChild(input);
    expect(() => getByLabel(doc, 'Submit')).toThrow();
  });

  it('trims whitespace: "  Submit  " matches label with text "Submit"', async () => {
    const { Document } = await import('./nodes/Document');
    const { getByLabel } = await import('./queries/label');
    const doc = new Document();
    const label = doc.createElement('label');
    label.setAttribute('for', 'btn');
    label.textContent = 'Submit';
    const input = doc.createElement('input');
    input.setAttribute('id', 'btn');
    doc.body.appendChild(label);
    doc.body.appendChild(input);
    const result = getByLabel(doc, '  Submit  ');
    expect(result).toBeDefined();
    expect(result.getAttribute('id')).toBe('btn');
  });
});
