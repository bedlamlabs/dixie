/**
 * DixieEnvironment — the core factory that creates an isolated, complete
 * browser environment for testing.
 *
 * Each environment has its own Window, Document, Storage, Timers, and
 * observers. Multiple environments can exist simultaneously with no
 * shared state between them.
 *
 * Usage:
 * ```ts
 * const env = createDixieEnvironment({ url: 'http://localhost:3000/dashboard' });
 * env.document.body.innerHTML = '<div id="app"></div>';
 * env.installGlobals();
 * // ... render React, run tests ...
 * env.uninstallGlobals();
 * env.destroy();
 * ```
 */

import { Document } from '../nodes/Document';
import { Window } from '../browser/Window';
import { createStorage } from '../browser/Storage';
import { TimerController } from '../browser/Timers';
import { clearMutationRegistry } from '../observers/MutationObserver';
import { Event } from '../events/Event';
import { CustomEvent } from '../events/CustomEvent';
import { UIEvent } from '../events/UIEvent';
import { MouseEvent } from '../events/MouseEvent';
import { KeyboardEvent } from '../events/KeyboardEvent';
import { FocusEvent } from '../events/FocusEvent';
import { InputEvent } from '../events/InputEvent';
import { PointerEvent } from '../events/PointerEvent';
import { MutationObserver } from '../observers/MutationObserver';
import { ResizeObserver } from '../observers/ResizeObserver';
import { IntersectionObserver } from '../observers/IntersectionObserver';
import { EventTarget } from '../events/EventTarget';
import { Element } from '../nodes/Element';
import { Node } from '../nodes/Node';
import { Text } from '../nodes/Text';
import { Comment } from '../nodes/Comment';
import { DocumentFragment } from '../nodes/DocumentFragment';
import { HTMLInputElement } from '../nodes/HTMLInputElement';
import { HTMLTextAreaElement } from '../nodes/HTMLTextAreaElement';
import { HTMLSelectElement } from '../nodes/HTMLSelectElement';
import { HTMLButtonElement } from '../nodes/HTMLButtonElement';
import { HTMLFormElement } from '../nodes/HTMLFormElement';
import { HTMLLabelElement } from '../nodes/HTMLLabelElement';
import { HTMLOptionElement } from '../nodes/HTMLOptionElement';
import { DOMParser } from '../browser/DOMParser';

import type { Location } from '../browser/Location';
import type { History } from '../browser/History';
import type { Navigator } from '../browser/Navigator';
import type { Screen } from '../browser/Screen';

// ── Types ────────────────────────────────────────────────────────────────

export interface DixieEnvironmentOptions {
  url?: string;
  width?: number;
  height?: number;
  userAgent?: string;
}

export interface DixieEnvironment {
  window: Window;
  document: Document;
  navigator: Navigator;
  location: Location;
  history: History;
  screen: Screen;
  localStorage: Storage;
  sessionStorage: Storage;
  timers: TimerController;

  reset(): void;
  destroy(): void;
  installGlobals(target?: object): void;
  uninstallGlobals(target?: object): void;
}

// ── Globals to install ───────────────────────────────────────────────────

// Tag map: constructor name → uppercase tag name for instanceof checks
const TAG_MAP: Record<string, string> = {
  HTMLElement: '',  // base — matches any element
  HTMLDivElement: 'DIV', HTMLSpanElement: 'SPAN', HTMLAnchorElement: 'A',
  HTMLButtonElement: 'BUTTON', HTMLInputElement: 'INPUT', HTMLTextAreaElement: 'TEXTAREA',
  HTMLSelectElement: 'SELECT', HTMLFormElement: 'FORM', HTMLIFrameElement: 'IFRAME',
  HTMLImageElement: 'IMG', HTMLLabelElement: 'LABEL', HTMLOptionElement: 'OPTION',
  HTMLTableElement: 'TABLE', HTMLTableRowElement: 'TR', HTMLTableCellElement: 'TD',
  HTMLUListElement: 'UL', HTMLOListElement: 'OL', HTMLLIElement: 'LI',
  HTMLParagraphElement: 'P', HTMLHeadingElement: 'H1', HTMLPreElement: 'PRE',
  HTMLCanvasElement: 'CANVAS', HTMLVideoElement: 'VIDEO', HTMLAudioElement: 'AUDIO',
  HTMLSourceElement: 'SOURCE', HTMLScriptElement: 'SCRIPT', HTMLStyleElement: 'STYLE',
  HTMLLinkElement: 'LINK', HTMLMetaElement: 'META', HTMLBodyElement: 'BODY',
  HTMLHeadElement: 'HEAD', HTMLHtmlElement: 'HTML', HTMLTemplateElement: 'TEMPLATE',
  HTMLSlotElement: 'SLOT', HTMLDialogElement: 'DIALOG', SVGElement: '',
};

const HTML_ELEMENT_NAMES = Object.keys(TAG_MAP) as (keyof typeof TAG_MAP)[];

// Real element classes that have prototype getter/setters (e.g. .checked, .value)
const REAL_ELEMENT_CLASSES: Record<string, any> = {
  HTMLInputElement, HTMLTextAreaElement, HTMLSelectElement,
  HTMLButtonElement, HTMLFormElement, HTMLLabelElement, HTMLOptionElement,
};

/** Create a dummy constructor with Symbol.hasInstance for tag-based instanceof. */
function createHTMLConstructor(tagName: string): any {
  const ctor = function() {} as any;
  ctor.prototype = Object.create(Element.prototype);
  Object.defineProperty(ctor, Symbol.hasInstance, {
    value: (obj: unknown) => {
      if (!(obj instanceof Element)) return false;
      if (!tagName) return true;
      return (obj as any).tagName === tagName;
    },
  });
  return ctor;
}

/** Add Symbol.hasInstance to a real class for tag-based instanceof. */
function addHasInstance(cls: any, tagName: string): void {
  if (!Object.getOwnPropertyDescriptor(cls, Symbol.hasInstance)) {
    Object.defineProperty(cls, Symbol.hasInstance, {
      value: (obj: unknown) => {
        if (!(obj instanceof Element)) return false;
        if (!tagName) return true;
        return (obj as any).tagName === tagName;
      },
    });
  }
}

// Build the final constructor map: real classes keep their prototypes, others get dummies
const HTML_CONSTRUCTORS_MAP: Record<string, any> = {};
for (const [name, tag] of Object.entries(TAG_MAP)) {
  if (REAL_ELEMENT_CLASSES[name]) {
    addHasInstance(REAL_ELEMENT_CLASSES[name], tag);
    HTML_CONSTRUCTORS_MAP[name] = REAL_ELEMENT_CLASSES[name];
  } else {
    HTML_CONSTRUCTORS_MAP[name] = createHTMLConstructor(tag);
  }
}

/** Keys that installGlobals sets on the target. Used for save/restore. */
const GLOBAL_KEYS = [
  'window',
  'document',
  'navigator',
  'location',
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
  'Node',
  'Document',
  'DocumentFragment',
  'Text',
  'Comment',
  'MutationObserver',
  'ResizeObserver',
  'IntersectionObserver',
  'Element',
  'EventTarget',
  'getComputedStyle',
  'matchMedia',
  'DOMParser',
  ...HTML_ELEMENT_NAMES,
] as const;

// Sentinel value to distinguish "property did not exist" from "property was undefined"
const NOT_SET = Symbol('NOT_SET');

// ── Factory ──────────────────────────────────────────────────────────────

/**
 * Pre-built values object for installGlobals. Event/observer classes are
 * the same for every environment, so we only build this once. The remaining
 * instance-specific values are patched into the object inside installGlobals.
 */
const STATIC_GLOBALS: Readonly<Record<string, unknown>> = Object.freeze({
  EventTarget,
  Event,
  CustomEvent,
  UIEvent,
  MouseEvent,
  KeyboardEvent,
  FocusEvent,
  InputEvent,
  PointerEvent,
  Node,
  Document,
  DocumentFragment,
  Text,
  Comment,
  MutationObserver,
  ResizeObserver,
  IntersectionObserver,
  Element,
  DOMParser,
  // HTML element constructors — real classes for elements with prototype getter/setters,
  // dummy constructors with Symbol.hasInstance for everything else
  ...HTML_CONSTRUCTORS_MAP,
});

export function createDixieEnvironment(options?: DixieEnvironmentOptions): DixieEnvironment {
  const url = options?.url ?? 'http://localhost/';
  const width = options?.width ?? 1024;
  const height = options?.height ?? 768;
  const userAgent = options?.userAgent;

  // 1. Create the Document
  const document = new Document();

  // 2. Create the Window
  const window = new Window({
    url,
    innerWidth: width,
    innerHeight: height,
  });

  // 3. Wire cross-references
  window.document = document;
  // Set document.defaultView if the Document supports it
  if ('defaultView' in document) {
    (document as any).defaultView = window;
  }

  // 4. Apply custom userAgent if provided
  if (userAgent !== undefined) {
    // Navigator.userAgent is readonly, so we override via defineProperty
    Object.defineProperty(window.navigator, 'userAgent', {
      value: userAgent,
      writable: false,
      configurable: true,
    });
  }

  // 5. Create storage instances
  const localStorage = createStorage();
  const sessionStorage = createStorage();

  // 6. Create timer controller
  const timers = new TimerController();

  // ── State tracking ──────────────────────────────────────────────────

  let destroyed = false;

  // Map from target → Map<key, original value or NOT_SET>
  const savedOriginals = new Map<object, Map<string, unknown>>();

  function assertNotDestroyed(): void {
    if (destroyed) {
      throw new Error('DixieEnvironment has been destroyed and cannot be used.');
    }
  }

  // ── Pre-bind timer functions once (avoid re-binding in installGlobals) ──

  const boundSetTimeout = timers.setTimeout.bind(timers);
  const boundClearTimeout = timers.clearTimeout.bind(timers);
  const boundSetInterval = timers.setInterval.bind(timers);
  const boundClearInterval = timers.clearInterval.bind(timers);
  const boundRaf = timers.requestAnimationFrame.bind(timers);
  const boundCaf = timers.cancelAnimationFrame.bind(timers);

  // ── Build the environment object ────────────────────────────────────

  const env: DixieEnvironment = {
    get window() {
      assertNotDestroyed();
      return window;
    },
    get document() {
      assertNotDestroyed();
      return document;
    },
    get navigator() {
      assertNotDestroyed();
      return window.navigator;
    },
    get location() {
      assertNotDestroyed();
      return window.location;
    },
    get history() {
      assertNotDestroyed();
      return window.history;
    },
    get screen() {
      assertNotDestroyed();
      return window.screen;
    },
    get localStorage() {
      assertNotDestroyed();
      return localStorage;
    },
    get sessionStorage() {
      assertNotDestroyed();
      return sessionStorage;
    },
    get timers() {
      assertNotDestroyed();
      return timers;
    },

    reset(): void {
      assertNotDestroyed();

      // Fast-clear document body: detach all children in batch
      const bodyChildren = document.body.childNodes;
      if (bodyChildren.length > 0) {
        while (document.body.firstChild) {
          document.body.removeChild(document.body.firstChild);
        }
      }

      // Fast-clear document head
      const headChildren = document.head.childNodes;
      if (headChildren.length > 0) {
        while (document.head.firstChild) {
          document.head.removeChild(document.head.firstChild);
        }
      }

      // Clear storage
      localStorage.clear();
      sessionStorage.clear();

      // Reset timers
      timers.reset();

      // Clear MutationObserver registry
      clearMutationRegistry();

      // Reset scroll position
      window.scrollX = 0;
      window.scrollY = 0;
    },

    destroy(): void {
      assertNotDestroyed();

      // Reset first to clean up
      env.reset();

      // Mark as destroyed
      destroyed = true;
    },

    installGlobals(target?: object): void {
      assertNotDestroyed();
      const t = (target ?? globalThis) as Record<string, unknown>;

      // Save originals for this target
      const originals = new Map<string, unknown>();

      for (const key of GLOBAL_KEYS) {
        originals.set(key, key in t ? t[key] : NOT_SET);
      }

      savedOriginals.set(t, originals);

      // Install instance-specific values. Use defineProperty for globals that
      // Node.js exposes as getter-only (navigator, localStorage, sessionStorage).
      const safeSet = (key: string, value: unknown) => {
        try {
          t[key] = value;
        } catch {
          Object.defineProperty(t, key, { value, writable: true, configurable: true });
        }
      };
      safeSet('window', window);
      safeSet('document', document);
      safeSet('navigator', window.navigator);
      safeSet('location', window.location);
      safeSet('localStorage', localStorage);
      safeSet('sessionStorage', sessionStorage);
      safeSet('setTimeout', boundSetTimeout);
      safeSet('clearTimeout', boundClearTimeout);
      safeSet('setInterval', boundSetInterval);
      safeSet('clearInterval', boundClearInterval);
      safeSet('requestAnimationFrame', boundRaf);
      safeSet('cancelAnimationFrame', boundCaf);

      // Install static globals (event classes, observer classes, DOM constructors)
      for (const [key, value] of Object.entries(STATIC_GLOBALS)) {
        safeSet(key, value);
      }

      // Also set on window object so `win.HTMLIFrameElement` works (React uses this)
      Object.assign(window, STATIC_GLOBALS);

      // Install getComputedStyle and matchMedia from the window
      safeSet('getComputedStyle', window.getComputedStyle.bind(window));
      safeSet('matchMedia', window.matchMedia.bind(window));
    },

    uninstallGlobals(target?: object): void {
      assertNotDestroyed();
      const t = (target ?? globalThis) as Record<string, unknown>;

      const originals = savedOriginals.get(t);
      if (!originals) return;

      for (const [key, original] of originals) {
        if (original === NOT_SET) {
          try { delete t[key]; } catch { /* readonly */ }
        } else {
          try {
            t[key] = original;
          } catch {
            Object.defineProperty(t, key, { value: original, writable: true, configurable: true });
          }
        }
      }

      savedOriginals.delete(t);
    },
  };

  return env;
}
