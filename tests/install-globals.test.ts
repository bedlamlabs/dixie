import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createDixieEnvironment } from '../src/environment/DixieEnvironment';
import { installGlobals } from '../src/environment/installGlobals';
import { Document } from '../src/nodes/Document';
import { Node } from '../src/nodes/Node';
import { Element } from '../src/nodes/Element';
import { DocumentFragment } from '../src/nodes/DocumentFragment';
import { Text } from '../src/nodes/Text';
import { Comment } from '../src/nodes/Comment';
import { Event } from '../src/events/Event';
import { CustomEvent } from '../src/events/CustomEvent';
import { MutationObserver } from '../src/observers/MutationObserver';
import { ResizeObserver } from '../src/observers/ResizeObserver';
import { IntersectionObserver } from '../src/observers/IntersectionObserver';

// ═══════════════════════════════════════════════════════════════════════
// installGlobals
// ═══════════════════════════════════════════════════════════════════════

describe('installGlobals', () => {
  let env: ReturnType<typeof createDixieEnvironment>;

  // Save original globals so we can verify restore
  const origDocument = (globalThis as any).document;
  const origWindow = (globalThis as any).window;

  beforeEach(() => {
    env = createDixieEnvironment({ url: 'http://test.local/page' });
  });

  afterEach(() => {
    env.destroy();
    // Safety net: restore known originals in case a test fails before restore()
    if (origDocument !== undefined) {
      (globalThis as any).document = origDocument;
    } else {
      delete (globalThis as any).document;
    }
    if (origWindow !== undefined) {
      (globalThis as any).window = origWindow;
    } else {
      delete (globalThis as any).window;
    }
  });

  // ─── Basic global installation ─────────────────────────────────────

  describe('basic installation', () => {
    it('sets document on globalThis', () => {
      const installation = installGlobals(env);
      try {
        expect((globalThis as any).document).toBe(env.document);
      } finally {
        installation.restore();
      }
    });

    it('sets window on globalThis', () => {
      const installation = installGlobals(env);
      try {
        expect((globalThis as any).window).toBe(env.window);
      } finally {
        installation.restore();
      }
    });

    it('sets navigator on globalThis (or skips if non-configurable)', () => {
      const installation = installGlobals(env);
      try {
        // In Node.js, globalThis.navigator is non-configurable.
        // installGlobals uses safeSet which skips non-configurable properties.
        const desc = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
        if (desc && !desc.configurable && !desc.writable && !desc.set) {
          // Navigator is non-configurable in this runtime — safeSet skips it
          expect(typeof (globalThis as any).navigator).toBe('object');
        } else {
          expect((globalThis as any).navigator).toBe(env.navigator);
        }
      } finally {
        installation.restore();
      }
    });

    it('sets localStorage on globalThis', () => {
      const installation = installGlobals(env);
      try {
        expect((globalThis as any).localStorage).toBe(env.localStorage);
      } finally {
        installation.restore();
      }
    });

    it('sets sessionStorage on globalThis', () => {
      const installation = installGlobals(env);
      try {
        expect((globalThis as any).sessionStorage).toBe(env.sessionStorage);
      } finally {
        installation.restore();
      }
    });

    it('sets location on globalThis', () => {
      const installation = installGlobals(env);
      try {
        expect((globalThis as any).location).toBe(env.location);
      } finally {
        installation.restore();
      }
    });

    it('sets history on globalThis', () => {
      const installation = installGlobals(env);
      try {
        expect((globalThis as any).history).toBe(env.history);
      } finally {
        installation.restore();
      }
    });
  });

  // ─── Event constructors ────────────────────────────────────────────

  describe('Event constructors', () => {
    it('sets Event on globalThis', () => {
      const installation = installGlobals(env);
      try {
        expect((globalThis as any).Event).toBe(Event);
      } finally {
        installation.restore();
      }
    });

    it('sets CustomEvent on globalThis', () => {
      const installation = installGlobals(env);
      try {
        expect((globalThis as any).CustomEvent).toBe(CustomEvent);
      } finally {
        installation.restore();
      }
    });
  });

  // ─── DOM constructors ──────────────────────────────────────────────

  describe('DOM constructors', () => {
    it('sets Node on globalThis', () => {
      const installation = installGlobals(env);
      try {
        expect((globalThis as any).Node).toBe(Node);
      } finally {
        installation.restore();
      }
    });

    it('sets Document on globalThis', () => {
      const installation = installGlobals(env);
      try {
        expect((globalThis as any).Document).toBe(Document);
      } finally {
        installation.restore();
      }
    });

    it('sets HTMLElement on globalThis with correct instanceof behavior', () => {
      const installation = installGlobals(env);
      try {
        const HTMLElement = (globalThis as any).HTMLElement;
        expect(typeof HTMLElement).toBe('function');
        // Any Element should pass instanceof HTMLElement
        const div = env.document.createElement('div');
        expect(div instanceof HTMLElement).toBe(true);
      } finally {
        installation.restore();
      }
    });

    it('sets DocumentFragment on globalThis', () => {
      const installation = installGlobals(env);
      try {
        expect((globalThis as any).DocumentFragment).toBe(DocumentFragment);
      } finally {
        installation.restore();
      }
    });

    it('sets Text on globalThis', () => {
      const installation = installGlobals(env);
      try {
        expect((globalThis as any).Text).toBe(Text);
      } finally {
        installation.restore();
      }
    });

    it('sets Comment on globalThis', () => {
      const installation = installGlobals(env);
      try {
        expect((globalThis as any).Comment).toBe(Comment);
      } finally {
        installation.restore();
      }
    });
  });

  // ─── Observers ─────────────────────────────────────────────────────

  describe('Observer constructors', () => {
    it('sets MutationObserver on globalThis', () => {
      const installation = installGlobals(env);
      try {
        expect((globalThis as any).MutationObserver).toBe(MutationObserver);
      } finally {
        installation.restore();
      }
    });

    it('sets ResizeObserver on globalThis', () => {
      const installation = installGlobals(env);
      try {
        expect((globalThis as any).ResizeObserver).toBe(ResizeObserver);
      } finally {
        installation.restore();
      }
    });

    it('sets IntersectionObserver on globalThis', () => {
      const installation = installGlobals(env);
      try {
        expect((globalThis as any).IntersectionObserver).toBe(IntersectionObserver);
      } finally {
        installation.restore();
      }
    });
  });

  // ─── getComputedStyle and matchMedia stubs ─────────────────────────

  describe('stubs', () => {
    it('sets getComputedStyle on globalThis', () => {
      const installation = installGlobals(env);
      try {
        const gcs = (globalThis as any).getComputedStyle;
        expect(typeof gcs).toBe('function');

        // Calling it should return a proxy that returns '' for any prop
        const result = gcs({});
        expect(result.color).toBe('');
        expect(result.fontSize).toBe('');
      } finally {
        installation.restore();
      }
    });

    it('sets matchMedia on globalThis', () => {
      const installation = installGlobals(env);
      try {
        const mm = (globalThis as any).matchMedia;
        expect(typeof mm).toBe('function');

        const result = mm('(min-width: 768px)');
        expect(result.matches).toBe(false);
        expect(result.media).toBe('(min-width: 768px)');
      } finally {
        installation.restore();
      }
    });
  });

  // ─── Timer functions ───────────────────────────────────────────────

  describe('timer functions', () => {
    it('sets setTimeout from environment timers', () => {
      const installation = installGlobals(env);
      try {
        const st = (globalThis as any).setTimeout;
        expect(typeof st).toBe('function');
      } finally {
        installation.restore();
      }
    });

    it('sets setInterval from environment timers', () => {
      const installation = installGlobals(env);
      try {
        const si = (globalThis as any).setInterval;
        expect(typeof si).toBe('function');
      } finally {
        installation.restore();
      }
    });

    it('sets clearTimeout from environment timers', () => {
      const installation = installGlobals(env);
      try {
        const ct = (globalThis as any).clearTimeout;
        expect(typeof ct).toBe('function');
      } finally {
        installation.restore();
      }
    });

    it('sets clearInterval from environment timers', () => {
      const installation = installGlobals(env);
      try {
        const ci = (globalThis as any).clearInterval;
        expect(typeof ci).toBe('function');
      } finally {
        installation.restore();
      }
    });

    it('sets requestAnimationFrame from environment timers', () => {
      const installation = installGlobals(env);
      try {
        const raf = (globalThis as any).requestAnimationFrame;
        expect(typeof raf).toBe('function');
      } finally {
        installation.restore();
      }
    });

    it('sets cancelAnimationFrame from environment timers', () => {
      const installation = installGlobals(env);
      try {
        const caf = (globalThis as any).cancelAnimationFrame;
        expect(typeof caf).toBe('function');
      } finally {
        installation.restore();
      }
    });

    it('installed setTimeout uses the environment timer controller', () => {
      env.timers.useFakeTimers();
      const installation = installGlobals(env);
      try {
        let called = false;
        (globalThis as any).setTimeout(() => { called = true; }, 100);
        expect(called).toBe(false);

        env.timers.tick(100);
        expect(called).toBe(true);
      } finally {
        installation.restore();
        env.timers.useRealTimers();
      }
    });
  });

  // ─── restore() ────────────────────────────────────────────────────

  describe('restore()', () => {
    it('removes all installed globals', () => {
      // First ensure document doesn't exist on globalThis (Node.js env)
      const hadDocument = 'document' in globalThis;
      const prevDocument = (globalThis as any).document;

      const installation = installGlobals(env);
      expect((globalThis as any).document).toBe(env.document);

      installation.restore();

      if (hadDocument) {
        expect((globalThis as any).document).toBe(prevDocument);
      }
      // The key test: after restore, document is NOT the Dixie document
      expect((globalThis as any).document).not.toBe(env.document);
    });

    it('restores original values if they existed', () => {
      // Set a known value
      const original = { test: true };
      (globalThis as any).HTMLElement = original;

      const installation = installGlobals(env);
      // After install, HTMLElement should be a constructor (not the original)
      expect((globalThis as any).HTMLElement).not.toBe(original);

      installation.restore();
      expect((globalThis as any).HTMLElement).toBe(original);

      // Cleanup
      delete (globalThis as any).HTMLElement;
    });

    it('deletes properties that did not exist before installation', () => {
      // Ensure Comment doesn't exist on globalThis
      const hadComment = 'Comment' in globalThis;
      const prevComment = (globalThis as any).Comment;

      if (hadComment) {
        delete (globalThis as any).Comment;
      }

      const installation = installGlobals(env);
      expect((globalThis as any).Comment).toBe(Comment);

      installation.restore();
      expect('Comment' in globalThis).toBe(false);

      // Restore if it existed
      if (hadComment) {
        (globalThis as any).Comment = prevComment;
      }
    });
  });

  // ─── Multiple installations ────────────────────────────────────────

  describe('multiple installations', () => {
    it('latest installation wins — globals reflect newest env', () => {
      const env2 = createDixieEnvironment({ url: 'http://test2.local/other' });

      const install1 = installGlobals(env);
      expect((globalThis as any).document).toBe(env.document);

      const install2 = installGlobals(env2);
      expect((globalThis as any).document).toBe(env2.document);

      // Restore in reverse order
      install2.restore();
      // After restoring install2, globals should be back to env (what install2 saved)
      expect((globalThis as any).document).toBe(env.document);

      install1.restore();

      env2.destroy();
    });

    it('restore chain works correctly with proper LIFO ordering', () => {
      const env2 = createDixieEnvironment({ url: 'http://test2.local/' });
      const env3 = createDixieEnvironment({ url: 'http://test3.local/' });

      const install1 = installGlobals(env);
      const install2 = installGlobals(env2);
      const install3 = installGlobals(env3);

      expect((globalThis as any).document).toBe(env3.document);

      install3.restore();
      expect((globalThis as any).document).toBe(env2.document);

      install2.restore();
      expect((globalThis as any).document).toBe(env.document);

      install1.restore();

      env2.destroy();
      env3.destroy();
    });
  });
});
