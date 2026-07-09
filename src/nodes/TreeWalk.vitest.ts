import { describe, it, expect } from 'vitest';
import { Document } from './Document';

// Live-collection regressions for the shared tree-walk helpers.
// Two hazards, both must hold at once:
//  1. Collections must be LIVE — a mutation after collection creation must be
//     visible on next access (the stale-cache bug: standalone fragments never
//     bump a _mutationVersion, so version-cached results went stale).
//  2. Document/Element-scoped queries keep their mutation-version cache (perf
//     hot path on script-heavy pages) without breaking liveness.

describe('tree-walk live collections', () => {
  it('element-scoped getElementsByClassName stays live across mutations', () => {
    const doc = new Document();
    const root = doc.createElement('div');
    doc.body.appendChild(root);
    for (let i = 0; i < 3; i++) {
      const el = doc.createElement('span');
      el.className = 'card';
      root.appendChild(el);
    }
    const collection = root.getElementsByClassName('card');
    expect(collection.length).toBe(3);
    const extra = doc.createElement('span');
    extra.className = 'card';
    root.appendChild(extra);
    expect(collection.length).toBe(4);
    root.removeChild(extra);
    expect(collection.length).toBe(3);
  });

  it('fragment-scoped queries stay live even without a mutation version', () => {
    const doc = new Document();
    const frag = doc.createDocumentFragment();
    // Sever the version signal the cache relies on — worst case for caching.
    (frag as any).ownerDocument = null;
    const a = doc.createElement('p');
    (a as any).ownerDocument = null;
    a.className = 'x';
    frag.appendChild(a);
    const byClass = frag.getElementsByClassName('x');
    const byTag = frag.getElementsByTagName('p');
    expect(byClass.length).toBe(1);
    expect(byTag.length).toBe(1);
    const b = doc.createElement('p');
    (b as any).ownerDocument = null;
    b.className = 'x';
    frag.appendChild(b);
    expect(byClass.length).toBe(2);
    expect(byTag.length).toBe(2);
  });

  it('document-scoped getElementsByTagName stays live', () => {
    const doc = new Document();
    doc.body.innerHTML = '<ul><li>a</li><li>b</li></ul>';
    const items = doc.getElementsByTagName('li');
    expect(items.length).toBe(2);
    const li = doc.createElement('li');
    doc.querySelector('ul')!.appendChild(li);
    expect(items.length).toBe(3);
  });
});
