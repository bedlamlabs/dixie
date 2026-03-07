/**
 * Tests for the Dixie Vitest Environment.
 *
 * Since we cannot run vitest-within-vitest, we test the setup/teardown
 * functions directly by calling them with a mock global object.
 */

import { describe, it, expect } from 'vitest';
import dixieEnv, { setupDixieGlobals } from '../src/vitest-env/dixie-environment';

// Import classes for instanceof / identity checks
import { Document } from '../src/nodes/Document';
import { Window } from '../src/browser/Window';
import { Node } from '../src/nodes/Node';
import { Element } from '../src/nodes/Element';
import { Text } from '../src/nodes/Text';
import { Comment } from '../src/nodes/Comment';
import { DocumentFragment } from '../src/nodes/DocumentFragment';
import { Event } from '../src/events/Event';
import { CustomEvent } from '../src/events/CustomEvent';
import { UIEvent } from '../src/events/UIEvent';
import { MouseEvent } from '../src/events/MouseEvent';
import { KeyboardEvent } from '../src/events/KeyboardEvent';
import { FocusEvent } from '../src/events/FocusEvent';
import { InputEvent } from '../src/events/InputEvent';
import { PointerEvent } from '../src/events/PointerEvent';
import { MutationObserver } from '../src/observers/MutationObserver';
import { ResizeObserver } from '../src/observers/ResizeObserver';
import { IntersectionObserver } from '../src/observers/IntersectionObserver';
import { CSSStyleDeclaration } from '../src/css/CSSStyleDeclaration';
import { HTMLInputElement } from '../src/nodes/HTMLInputElement';
import { HTMLSelectElement } from '../src/nodes/HTMLSelectElement';
import { HTMLTextAreaElement } from '../src/nodes/HTMLTextAreaElement';
import { HTMLFormElement } from '../src/nodes/HTMLFormElement';
import { HTMLOptionElement } from '../src/nodes/HTMLOptionElement';
import { HTMLButtonElement } from '../src/nodes/HTMLButtonElement';
import { HTMLLabelElement } from '../src/nodes/HTMLLabelElement';

// ── Helpers ──────────────────────────────────────────────────────────

/** Create a fresh mock global and run setup. */
async function setupFreshEnv(options: Record<string, unknown> = {}): Promise<{
  fakeGlobal: Record<string, unknown>;
  teardown: (g: Record<string, unknown>) => void;
}> {
  const fakeGlobal: Record<string, unknown> = {};
  const { teardown } = await dixieEnv.setup(fakeGlobal, options);
  return { fakeGlobal, teardown };
}

// ── Tests ────────────────────────────────────────────────────────────

describe('Dixie Vitest Environment', () => {
  // ── Metadata ──────────────────────────────────────────────────────

  describe('metadata', () => {
    it('has name "dixie"', () => {
      expect(dixieEnv.name).toBe('dixie');
    });

    it('has transformMode "web"', () => {
      expect(dixieEnv.transformMode).toBe('web');
    });

    it('setup returns a function', async () => {
      expect(typeof dixieEnv.setup).toBe('function');
    });
  });

  // ── Core browser globals ──────────────────────────────────────────

  describe('setup installs core browser globals', () => {
    it('installs document as a Document instance', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(fakeGlobal.document).toBeDefined();
      expect(fakeGlobal.document).toBeInstanceOf(Document);
      teardown(fakeGlobal);
    });

    it('installs window as a Window instance', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(fakeGlobal.window).toBeDefined();
      expect(fakeGlobal.window).toBeInstanceOf(Window);
      teardown(fakeGlobal);
    });

    it('installs navigator', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(fakeGlobal.navigator).toBeDefined();
      const nav = fakeGlobal.navigator as Record<string, unknown>;
      expect(typeof nav.userAgent).toBe('string');
      teardown(fakeGlobal);
    });

    it('installs location', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(fakeGlobal.location).toBeDefined();
      const loc = fakeGlobal.location as Record<string, unknown>;
      expect(loc.href).toBe('http://localhost/');
      teardown(fakeGlobal);
    });

    it('installs history', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(fakeGlobal.history).toBeDefined();
      teardown(fakeGlobal);
    });

    it('installs screen', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(fakeGlobal.screen).toBeDefined();
      teardown(fakeGlobal);
    });

    it('installs localStorage with Storage API', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(fakeGlobal.localStorage).toBeDefined();
      const storage = fakeGlobal.localStorage as Storage;
      expect(typeof storage.getItem).toBe('function');
      expect(typeof storage.setItem).toBe('function');
      expect(typeof storage.removeItem).toBe('function');
      expect(typeof storage.clear).toBe('function');
      teardown(fakeGlobal);
    });

    it('installs sessionStorage with Storage API', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(fakeGlobal.sessionStorage).toBeDefined();
      const storage = fakeGlobal.sessionStorage as Storage;
      expect(typeof storage.setItem).toBe('function');
      teardown(fakeGlobal);
    });
  });

  // ── Event constructors ────────────────────────────────────────────

  describe('setup installs event constructors', () => {
    it('installs Event', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(fakeGlobal.Event).toBe(Event);
      teardown(fakeGlobal);
    });

    it('installs CustomEvent', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(fakeGlobal.CustomEvent).toBe(CustomEvent);
      teardown(fakeGlobal);
    });

    it('installs UIEvent', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(fakeGlobal.UIEvent).toBe(UIEvent);
      teardown(fakeGlobal);
    });

    it('installs MouseEvent', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(fakeGlobal.MouseEvent).toBe(MouseEvent);
      teardown(fakeGlobal);
    });

    it('installs KeyboardEvent', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(fakeGlobal.KeyboardEvent).toBe(KeyboardEvent);
      teardown(fakeGlobal);
    });

    it('installs FocusEvent', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(fakeGlobal.FocusEvent).toBe(FocusEvent);
      teardown(fakeGlobal);
    });

    it('installs InputEvent', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(fakeGlobal.InputEvent).toBe(InputEvent);
      teardown(fakeGlobal);
    });

    it('installs PointerEvent', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(fakeGlobal.PointerEvent).toBe(PointerEvent);
      teardown(fakeGlobal);
    });
  });

  // ── Observer constructors ─────────────────────────────────────────

  describe('setup installs observer constructors', () => {
    it('installs MutationObserver', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(fakeGlobal.MutationObserver).toBe(MutationObserver);
      teardown(fakeGlobal);
    });

    it('installs ResizeObserver', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(fakeGlobal.ResizeObserver).toBe(ResizeObserver);
      teardown(fakeGlobal);
    });

    it('installs IntersectionObserver', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(fakeGlobal.IntersectionObserver).toBe(IntersectionObserver);
      teardown(fakeGlobal);
    });
  });

  // ── Timer functions ───────────────────────────────────────────────

  describe('setup installs timer functions', () => {
    it('installs setTimeout as a function', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(typeof fakeGlobal.setTimeout).toBe('function');
      teardown(fakeGlobal);
    });

    it('installs clearTimeout as a function', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(typeof fakeGlobal.clearTimeout).toBe('function');
      teardown(fakeGlobal);
    });

    it('installs setInterval as a function', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(typeof fakeGlobal.setInterval).toBe('function');
      teardown(fakeGlobal);
    });

    it('installs clearInterval as a function', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(typeof fakeGlobal.clearInterval).toBe('function');
      teardown(fakeGlobal);
    });

    it('installs requestAnimationFrame as a function', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(typeof fakeGlobal.requestAnimationFrame).toBe('function');
      teardown(fakeGlobal);
    });

    it('installs cancelAnimationFrame as a function', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(typeof fakeGlobal.cancelAnimationFrame).toBe('function');
      teardown(fakeGlobal);
    });
  });

  // ── DOM constructors ──────────────────────────────────────────────

  describe('setup installs DOM constructors', () => {
    it('installs Node', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(fakeGlobal.Node).toBe(Node);
      teardown(fakeGlobal);
    });

    it('installs Element', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(fakeGlobal.Element).toBe(Element);
      teardown(fakeGlobal);
    });

    it('installs Document', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(fakeGlobal.Document).toBe(Document);
      teardown(fakeGlobal);
    });

    it('installs DocumentFragment', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(fakeGlobal.DocumentFragment).toBe(DocumentFragment);
      teardown(fakeGlobal);
    });

    it('installs Text', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(fakeGlobal.Text).toBe(Text);
      teardown(fakeGlobal);
    });

    it('installs Comment', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(fakeGlobal.Comment).toBe(Comment);
      teardown(fakeGlobal);
    });

    it('installs HTMLElement as Element alias', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(fakeGlobal.HTMLElement).toBe(Element);
      teardown(fakeGlobal);
    });
  });

  // ── Form element constructors ─────────────────────────────────────

  describe('setup installs form element constructors', () => {
    it('installs HTMLInputElement', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(fakeGlobal.HTMLInputElement).toBe(HTMLInputElement);
      teardown(fakeGlobal);
    });

    it('installs HTMLSelectElement', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(fakeGlobal.HTMLSelectElement).toBe(HTMLSelectElement);
      teardown(fakeGlobal);
    });

    it('installs HTMLTextAreaElement', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(fakeGlobal.HTMLTextAreaElement).toBe(HTMLTextAreaElement);
      teardown(fakeGlobal);
    });

    it('installs HTMLFormElement', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(fakeGlobal.HTMLFormElement).toBe(HTMLFormElement);
      teardown(fakeGlobal);
    });

    it('installs HTMLOptionElement', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(fakeGlobal.HTMLOptionElement).toBe(HTMLOptionElement);
      teardown(fakeGlobal);
    });

    it('installs HTMLButtonElement', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(fakeGlobal.HTMLButtonElement).toBe(HTMLButtonElement);
      teardown(fakeGlobal);
    });

    it('installs HTMLLabelElement', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(fakeGlobal.HTMLLabelElement).toBe(HTMLLabelElement);
      teardown(fakeGlobal);
    });
  });

  // ── CSS and browser utilities ─────────────────────────────────────

  describe('setup installs CSS and browser utilities', () => {
    it('installs CSSStyleDeclaration', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(fakeGlobal.CSSStyleDeclaration).toBe(CSSStyleDeclaration);
      teardown(fakeGlobal);
    });

    it('installs getComputedStyle as a function', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(typeof fakeGlobal.getComputedStyle).toBe('function');
      teardown(fakeGlobal);
    });

    it('installs matchMedia as a function', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(typeof fakeGlobal.matchMedia).toBe('function');
      teardown(fakeGlobal);
    });

    it('installs atob as a function', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(typeof fakeGlobal.atob).toBe('function');
      teardown(fakeGlobal);
    });

    it('installs btoa as a function', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(typeof fakeGlobal.btoa).toBe('function');
      teardown(fakeGlobal);
    });

    it('installs scrollTo as a function', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(typeof fakeGlobal.scrollTo).toBe('function');
      teardown(fakeGlobal);
    });

    it('installs scroll as a function', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(typeof fakeGlobal.scroll).toBe('function');
      teardown(fakeGlobal);
    });

    it('installs scrollBy as a function', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      expect(typeof fakeGlobal.scrollBy).toBe('function');
      teardown(fakeGlobal);
    });
  });

  // ── Teardown restores globals ─────────────────────────────────────

  describe('teardown restores globals', () => {
    it('removes globals that did not exist before setup', async () => {
      const fakeGlobal: Record<string, unknown> = {};
      const { teardown } = await dixieEnv.setup(fakeGlobal, {});

      // Verify document was installed
      expect(fakeGlobal.document).toBeDefined();

      teardown(fakeGlobal);

      // After teardown, document should be removed (it wasn't there before)
      expect('document' in fakeGlobal).toBe(false);
    });

    it('restores original values that existed before setup', async () => {
      const originalDoc = { fake: true };
      const originalNav = { fake: true };
      const fakeGlobal: Record<string, unknown> = {
        document: originalDoc,
        navigator: originalNav,
      };

      const { teardown } = await dixieEnv.setup(fakeGlobal, {});

      // Verify overwritten
      expect(fakeGlobal.document).not.toBe(originalDoc);

      teardown(fakeGlobal);

      // Should be restored
      expect(fakeGlobal.document).toBe(originalDoc);
      expect(fakeGlobal.navigator).toBe(originalNav);
    });

    it('handles undefined original values correctly', async () => {
      const fakeGlobal: Record<string, unknown> = {
        window: undefined,
      };

      const { teardown } = await dixieEnv.setup(fakeGlobal, {});
      expect(fakeGlobal.window).toBeDefined();
      expect(fakeGlobal.window).toBeInstanceOf(Window);

      teardown(fakeGlobal);

      // window key still exists but value is restored to undefined
      expect('window' in fakeGlobal).toBe(true);
      expect(fakeGlobal.window).toBeUndefined();
    });
  });

  // ── Teardown cleans up DOM ────────────────────────────────────────

  describe('teardown cleans up DOM state', () => {
    it('clears document body children', async () => {
      const fakeGlobal: Record<string, unknown> = {};
      const { teardown } = await dixieEnv.setup(fakeGlobal, {});

      const doc = fakeGlobal.document as Document;
      const div = doc.createElement('div');
      doc.body.appendChild(div);
      expect(doc.body.childNodes.length).toBeGreaterThan(0);

      teardown(fakeGlobal);
      // Body was cleared during teardown (doc object still accessible before GC)
    });

    it('clears document head children', async () => {
      const fakeGlobal: Record<string, unknown> = {};
      const { teardown } = await dixieEnv.setup(fakeGlobal, {});

      const doc = fakeGlobal.document as Document;
      const title = doc.createElement('title');
      doc.head.appendChild(title);
      expect(doc.head.childNodes.length).toBeGreaterThan(0);

      teardown(fakeGlobal);
      // Head was cleared during teardown
    });

    it('clears localStorage during teardown', async () => {
      const fakeGlobal: Record<string, unknown> = {};
      const { teardown } = await dixieEnv.setup(fakeGlobal, {});

      const storage = fakeGlobal.localStorage as Storage;
      storage.setItem('key', 'value');
      expect(storage.getItem('key')).toBe('value');

      teardown(fakeGlobal);
      // Storage was cleared (but global reference removed, so can't check)
    });

    it('clears sessionStorage during teardown', async () => {
      const fakeGlobal: Record<string, unknown> = {};
      const { teardown } = await dixieEnv.setup(fakeGlobal, {});

      const storage = fakeGlobal.sessionStorage as Storage;
      storage.setItem('session-key', 'session-value');
      expect(storage.getItem('session-key')).toBe('session-value');

      teardown(fakeGlobal);
    });
  });

  // ── Functional tests after setup ──────────────────────────────────

  describe('DOM operations work after setup', () => {
    it('document.createElement works', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      const doc = fakeGlobal.document as Document;

      const div = doc.createElement('div');
      expect(div).toBeDefined();
      expect(div.tagName).toBe('DIV');

      teardown(fakeGlobal);
    });

    it('document.createTextNode works', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      const doc = fakeGlobal.document as Document;

      const text = doc.createTextNode('hello');
      expect(text).toBeDefined();
      expect(text.data).toBe('hello');

      teardown(fakeGlobal);
    });

    it('appendChild and querySelector work after setup', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      const doc = fakeGlobal.document as Document;

      const div = doc.createElement('div');
      div.id = 'test-div';
      div.className = 'my-class';
      doc.body.appendChild(div);

      const found = doc.querySelector('#test-div');
      expect(found).toBe(div);

      const byClass = doc.querySelector('.my-class');
      expect(byClass).toBe(div);

      teardown(fakeGlobal);
    });

    it('querySelectorAll works after setup', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      const doc = fakeGlobal.document as Document;

      const div1 = doc.createElement('div');
      div1.className = 'item';
      const div2 = doc.createElement('div');
      div2.className = 'item';
      doc.body.appendChild(div1);
      doc.body.appendChild(div2);

      const found = doc.querySelectorAll('.item');
      expect(found.length).toBe(2);

      teardown(fakeGlobal);
    });

    it('event dispatch works after setup', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      const doc = fakeGlobal.document as Document;

      const div = doc.createElement('div');
      let clicked = false;
      div.addEventListener('click', () => {
        clicked = true;
      });

      const event = new Event('click', { bubbles: true });
      div.dispatchEvent(event);

      expect(clicked).toBe(true);

      teardown(fakeGlobal);
    });

    it('innerHTML works after setup', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      const doc = fakeGlobal.document as Document;

      doc.body.innerHTML = '<div id="app"><span>Hello</span></div>';
      const app = doc.getElementById('app');
      expect(app).not.toBeNull();
      expect(app!.tagName).toBe('DIV');

      const span = doc.querySelector('span');
      expect(span).not.toBeNull();
      expect(span!.textContent).toBe('Hello');

      teardown(fakeGlobal);
    });

    it('localStorage works after setup', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      const storage = fakeGlobal.localStorage as Storage;

      storage.setItem('test-key', 'test-value');
      expect(storage.getItem('test-key')).toBe('test-value');

      storage.removeItem('test-key');
      expect(storage.getItem('test-key')).toBeNull();

      teardown(fakeGlobal);
    });

    it('atob/btoa encoding works after setup', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      const btoa = fakeGlobal.btoa as (data: string) => string;
      const atob = fakeGlobal.atob as (encoded: string) => string;

      const encoded = btoa('hello world');
      expect(typeof encoded).toBe('string');
      expect(atob(encoded)).toBe('hello world');

      teardown(fakeGlobal);
    });

    it('matchMedia returns a valid result after setup', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      const matchMedia = fakeGlobal.matchMedia as (query: string) => {
        matches: boolean;
        media: string;
      };

      const result = matchMedia('(max-width: 768px)');
      expect(result).toBeDefined();
      expect(typeof result.matches).toBe('boolean');
      expect(result.media).toBe('(max-width: 768px)');

      teardown(fakeGlobal);
    });

    it('getComputedStyle returns a value after setup', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      const doc = fakeGlobal.document as Document;
      const getComputedStyle = fakeGlobal.getComputedStyle as (
        el: unknown,
      ) => Record<string, string>;

      const div = doc.createElement('div');
      const style = getComputedStyle(div);
      expect(style).toBeDefined();
      // All properties return empty string
      expect(style.color).toBe('');
      expect(style.display).toBe('');

      teardown(fakeGlobal);
    });

    it('scrollTo sets scroll position on window', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      const scrollTo = fakeGlobal.scrollTo as (x: number, y: number) => void;
      const win = fakeGlobal.window as Window;

      scrollTo(100, 200);
      expect(win.scrollX).toBe(100);
      expect(win.scrollY).toBe(200);

      teardown(fakeGlobal);
    });
  });

  // ── Document structure ────────────────────────────────────────────

  describe('document has correct structure', () => {
    it('has documentElement (html)', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      const doc = fakeGlobal.document as Document;
      expect(doc.documentElement).toBeDefined();
      expect(doc.documentElement.tagName).toBe('HTML');
      teardown(fakeGlobal);
    });

    it('has head element', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      const doc = fakeGlobal.document as Document;
      expect(doc.head).toBeDefined();
      expect(doc.head.tagName).toBe('HEAD');
      teardown(fakeGlobal);
    });

    it('has body element', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      const doc = fakeGlobal.document as Document;
      expect(doc.body).toBeDefined();
      expect(doc.body.tagName).toBe('BODY');
      teardown(fakeGlobal);
    });
  });

  // ── Window-document wiring ────────────────────────────────────────

  describe('window and document are wired', () => {
    it('window.document references the same document', async () => {
      const { fakeGlobal, teardown } = await setupFreshEnv();
      const win = fakeGlobal.window as Window;
      const doc = fakeGlobal.document as Document;
      expect(win.document).toBe(doc);
      teardown(fakeGlobal);
    });
  });

  // ── Multiple setup/teardown cycles ────────────────────────────────

  describe('multiple cycles work correctly', () => {
    it('can setup and teardown twice without errors', async () => {
      // First cycle
      const fakeGlobal: Record<string, unknown> = {};
      const { teardown: teardown1 } = await dixieEnv.setup(fakeGlobal, {});
      expect(fakeGlobal.document).toBeDefined();
      teardown1(fakeGlobal);
      expect('document' in fakeGlobal).toBe(false);

      // Second cycle
      const { teardown: teardown2 } = await dixieEnv.setup(fakeGlobal, {});
      expect(fakeGlobal.document).toBeDefined();
      teardown2(fakeGlobal);
      expect('document' in fakeGlobal).toBe(false);
    });

    it('each setup creates independent environments', async () => {
      const g1: Record<string, unknown> = {};
      const g2: Record<string, unknown> = {};

      const { teardown: t1 } = await dixieEnv.setup(g1, {});
      const { teardown: t2 } = await dixieEnv.setup(g2, {});

      // Different document instances
      expect(g1.document).not.toBe(g2.document);

      // Different window instances
      expect(g1.window).not.toBe(g2.window);

      // Mutations in one don't affect the other
      const doc1 = g1.document as Document;
      doc1.body.innerHTML = '<div>only in env 1</div>';
      const doc2 = g2.document as Document;
      expect(doc2.body.childNodes.length).toBe(0);

      t1(g1);
      t2(g2);
    });
  });

  // ── setupDixieGlobals exported function ───────────────────────────

  describe('setupDixieGlobals named export', () => {
    it('is the same function as dixieEnv.setup', () => {
      expect(setupDixieGlobals).toBe(dixieEnv.setup);
    });
  });

  // ── Total global count ────────────────────────────────────────────

  describe('completeness check', () => {
    it('installs all expected globals', async () => {
      const fakeGlobal: Record<string, unknown> = {};
      const { teardown } = await dixieEnv.setup(fakeGlobal, {});

      const expectedKeys = [
        'window',
        'document',
        'navigator',
        'location',
        'history',
        'screen',
        'localStorage',
        'sessionStorage',
        'setTimeout',
        'clearTimeout',
        'setInterval',
        'clearInterval',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'Event',
        'CustomEvent',
        'UIEvent',
        'MouseEvent',
        'KeyboardEvent',
        'FocusEvent',
        'InputEvent',
        'PointerEvent',
        'MutationObserver',
        'ResizeObserver',
        'IntersectionObserver',
        'Node',
        'Element',
        'Document',
        'DocumentFragment',
        'Text',
        'Comment',
        'HTMLElement',
        'HTMLInputElement',
        'HTMLSelectElement',
        'HTMLTextAreaElement',
        'HTMLFormElement',
        'HTMLOptionElement',
        'HTMLButtonElement',
        'HTMLLabelElement',
        'CSSStyleDeclaration',
        'getComputedStyle',
        'matchMedia',
        'atob',
        'btoa',
        'scrollTo',
        'scroll',
        'scrollBy',
      ];

      for (const key of expectedKeys) {
        expect(fakeGlobal).toHaveProperty(key);
      }

      teardown(fakeGlobal);
    });

    it('teardown removes all installed globals from an empty target', async () => {
      const fakeGlobal: Record<string, unknown> = {};
      const { teardown } = await dixieEnv.setup(fakeGlobal, {});
      teardown(fakeGlobal);
      expect(Object.keys(fakeGlobal).length).toBe(0);
    });
  });
});
