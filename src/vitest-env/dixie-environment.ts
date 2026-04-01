/**
 * Dixie Vitest Environment — a custom vitest environment that installs
 * Dixie's DOM engine as the global browser context.
 *
 * Usage:
 *   In vitest.config.ts: `environment: 'dixie'`
 *   Or per-file: `// @vitest-environment dixie`
 *
 * When vitest loads this environment, it calls setup() before tests
 * and teardown() after. setup() installs all DOM globals (window,
 * document, navigator, etc.) on the vitest global object. teardown()
 * restores the originals.
 */

import { Document } from '../nodes/Document';
import { Window } from '../browser/Window';
import { createStorage } from '../browser/Storage';
import { TimerController } from '../browser/Timers';
import { clearMutationRegistry } from '../observers/MutationObserver';

// DOM node constructors
import { Node } from '../nodes/Node';
import { Element } from '../nodes/Element';
import { Text } from '../nodes/Text';
import { Comment } from '../nodes/Comment';
import { DocumentFragment } from '../nodes/DocumentFragment';

// Event constructors
import { Event } from '../events/Event';
import { CustomEvent } from '../events/CustomEvent';
import { UIEvent } from '../events/UIEvent';
import { MouseEvent } from '../events/MouseEvent';
import { KeyboardEvent } from '../events/KeyboardEvent';
import { FocusEvent } from '../events/FocusEvent';
import { InputEvent } from '../events/InputEvent';
import { PointerEvent } from '../events/PointerEvent';

// Observer constructors
import { MutationObserver } from '../observers/MutationObserver';
import { ResizeObserver } from '../observers/ResizeObserver';
import { IntersectionObserver } from '../observers/IntersectionObserver';

// CSS
import { CSSStyleDeclaration } from '../css/CSSStyleDeclaration';

// Form element constructors
import { HTMLInputElement } from '../nodes/HTMLInputElement';
import { HTMLSelectElement } from '../nodes/HTMLSelectElement';
import { HTMLTextAreaElement } from '../nodes/HTMLTextAreaElement';
import { HTMLFormElement } from '../nodes/HTMLFormElement';
import { HTMLOptionElement } from '../nodes/HTMLOptionElement';
import { HTMLButtonElement } from '../nodes/HTMLButtonElement';
import { HTMLLabelElement } from '../nodes/HTMLLabelElement';

// ── Sentinel for "property didn't exist" vs "property was undefined" ──

const NOT_SET = Symbol('NOT_SET');

// ── List of all globals we install ────────────────────────────────────

const GLOBAL_KEYS = [
  // Core browser objects
  'window',
  'document',
  'navigator',
  'location',
  'history',
  'screen',
  'localStorage',
  'sessionStorage',

  // Timers
  'setTimeout',
  'clearTimeout',
  'setInterval',
  'clearInterval',
  'requestAnimationFrame',
  'cancelAnimationFrame',

  // Event constructors
  'Event',
  'CustomEvent',
  'UIEvent',
  'MouseEvent',
  'KeyboardEvent',
  'FocusEvent',
  'InputEvent',
  'PointerEvent',

  // Observer constructors
  'MutationObserver',
  'ResizeObserver',
  'IntersectionObserver',

  // DOM constructors
  'Node',
  'Element',
  'Document',
  'DocumentFragment',
  'Text',
  'Comment',
  'HTMLElement',

  // Form element constructors
  'HTMLInputElement',
  'HTMLSelectElement',
  'HTMLTextAreaElement',
  'HTMLFormElement',
  'HTMLOptionElement',
  'HTMLButtonElement',
  'HTMLLabelElement',

  // CSS
  'CSSStyleDeclaration',

  // Browser utilities
  'getComputedStyle',
  'matchMedia',
  'atob',
  'btoa',
  'scrollTo',
  'scroll',
  'scrollBy',
] as const;

// ── Environment type (compatible with vitest Environment interface) ────

export interface DixieVitestEnvironment {
  name: string;
  transformMode: string;
  setup(
    global: Record<string, unknown>,
    options: Record<string, unknown>,
  ): Promise<{ teardown(global: Record<string, unknown>): void }>;
}

// ── setup/teardown implementation ─────────────────────────────────────

/**
 * Create a fresh Dixie environment and install all globals onto the
 * provided global object. Returns a teardown function that restores
 * all originals.
 */
export async function setupDixieGlobals(
  global: Record<string, unknown>,
  options: Record<string, unknown>,
): Promise<{ teardown(global: Record<string, unknown>): void }> {
  // Extract environment options
  const envOptions = (options?.dixie ?? {}) as Record<string, unknown>;
  const url = (envOptions.url as string) ?? 'http://localhost/';
  const width = (envOptions.width as number) ?? 1024;
  const height = (envOptions.height as number) ?? 768;

  // 1. Create core objects
  const document = new Document();
  const window = new Window({
    url,
    innerWidth: width,
    innerHeight: height,
  });
  window.document = document;
  if ('defaultView' in document) {
    (document as unknown as Record<string, unknown>).defaultView = window;
  }

  const localStorage = createStorage();
  const sessionStorage = createStorage();
  const timers = new TimerController();

  // 2. Save original values
  const originals = new Map<string, unknown>();
  for (const key of GLOBAL_KEYS) {
    if (key in global) {
      originals.set(key, global[key]);
    } else {
      originals.set(key, NOT_SET);
    }
  }

  // 3. Install globals

  // Core browser objects
  global['window'] = window;
  global['document'] = document;
  global['navigator'] = window.navigator;
  global['location'] = window.location;
  global['history'] = window.history;
  global['screen'] = window.screen;
  global['localStorage'] = localStorage;
  global['sessionStorage'] = sessionStorage;

  // Timers
  global['setTimeout'] = timers.setTimeout.bind(timers);
  global['clearTimeout'] = timers.clearTimeout.bind(timers);
  global['setInterval'] = timers.setInterval.bind(timers);
  global['clearInterval'] = timers.clearInterval.bind(timers);
  global['requestAnimationFrame'] = timers.requestAnimationFrame.bind(timers);
  global['cancelAnimationFrame'] = timers.cancelAnimationFrame.bind(timers);

  // Event constructors
  global['Event'] = Event;
  global['CustomEvent'] = CustomEvent;
  global['UIEvent'] = UIEvent;
  global['MouseEvent'] = MouseEvent;
  global['KeyboardEvent'] = KeyboardEvent;
  global['FocusEvent'] = FocusEvent;
  global['InputEvent'] = InputEvent;
  global['PointerEvent'] = PointerEvent;

  // Observer constructors
  global['MutationObserver'] = MutationObserver;
  global['ResizeObserver'] = ResizeObserver;
  global['IntersectionObserver'] = IntersectionObserver;

  // DOM constructors
  global['Node'] = Node;
  global['Element'] = Element;
  global['Document'] = Document;
  global['DocumentFragment'] = DocumentFragment;
  global['Text'] = Text;
  global['Comment'] = Comment;
  global['HTMLElement'] = Element; // alias

  // Form element constructors
  global['HTMLInputElement'] = HTMLInputElement;
  global['HTMLSelectElement'] = HTMLSelectElement;
  global['HTMLTextAreaElement'] = HTMLTextAreaElement;
  global['HTMLFormElement'] = HTMLFormElement;
  global['HTMLOptionElement'] = HTMLOptionElement;
  global['HTMLButtonElement'] = HTMLButtonElement;
  global['HTMLLabelElement'] = HTMLLabelElement;

  // CSS
  global['CSSStyleDeclaration'] = CSSStyleDeclaration;

  // Browser utilities
  global['getComputedStyle'] = window.getComputedStyle.bind(window);
  global['matchMedia'] = window.matchMedia.bind(window);
  global['atob'] = window.atob.bind(window);
  global['btoa'] = window.btoa.bind(window);
  global['scrollTo'] = window.scrollTo.bind(window);
  global['scroll'] = window.scroll.bind(window);
  global['scrollBy'] = window.scrollBy.bind(window);

  // 4. Return teardown
  return {
    teardown(global: Record<string, unknown>): void {
      // Clean up document
      while (document.body.firstChild) {
        document.body.removeChild(document.body.firstChild);
      }
      while (document.head.firstChild) {
        document.head.removeChild(document.head.firstChild);
      }

      // Clear storage
      localStorage.clear();
      sessionStorage.clear();

      // Reset timers
      timers.reset();

      // Clear MutationObserver registry
      clearMutationRegistry();

      // Restore all original globals
      for (const [key, original] of originals) {
        if (original === NOT_SET) {
          delete global[key];
        } else {
          global[key] = original;
        }
      }
    },
  };
}

// ── Exported environment object ────────────────────────────────────────

const dixieEnvironment: DixieVitestEnvironment = {
  name: 'dixie',
  transformMode: 'web',
  setup: setupDixieGlobals,
};

export default dixieEnvironment;
