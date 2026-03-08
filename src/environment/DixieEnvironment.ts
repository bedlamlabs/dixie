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

// HTML element constructors that React and libraries check via instanceof.
// All map to Element since we don't need subclass-specific behavior.
const HTML_ELEMENT_NAMES = [
  'HTMLElement', 'HTMLDivElement', 'HTMLSpanElement', 'HTMLAnchorElement',
  'HTMLButtonElement', 'HTMLInputElement', 'HTMLTextAreaElement',
  'HTMLSelectElement', 'HTMLFormElement', 'HTMLIFrameElement',
  'HTMLImageElement', 'HTMLLabelElement', 'HTMLOptionElement',
  'HTMLTableElement', 'HTMLTableRowElement', 'HTMLTableCellElement',
  'HTMLUListElement', 'HTMLOListElement', 'HTMLLIElement',
  'HTMLParagraphElement', 'HTMLHeadingElement', 'HTMLPreElement',
  'HTMLCanvasElement', 'HTMLVideoElement', 'HTMLAudioElement',
  'HTMLSourceElement', 'HTMLScriptElement', 'HTMLStyleElement',
  'HTMLLinkElement', 'HTMLMetaElement', 'HTMLBodyElement',
  'HTMLHeadElement', 'HTMLHtmlElement', 'HTMLTemplateElement',
  'HTMLSlotElement', 'HTMLDialogElement', 'SVGElement',
] as const;

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
  'EventTarget',
  'getComputedStyle',
  'matchMedia',
  ...HTML_ELEMENT_NAMES,
] as const;

// Sentinel value to distinguish "property did not exist" from "property was undefined"
const NOT_SET = Symbol('NOT_SET');

// ── Factory ──────────────────────────────────────────────────────────────

// ── Tag mapping for Symbol.hasInstance constructors ──────────────────

const TAG_MAP: Record<string, string> = {
  HTMLElement: '',
  HTMLDivElement: 'DIV',
  HTMLSpanElement: 'SPAN',
  HTMLAnchorElement: 'A',
  HTMLButtonElement: 'BUTTON',
  HTMLInputElement: 'INPUT',
  HTMLTextAreaElement: 'TEXTAREA',
  HTMLSelectElement: 'SELECT',
  HTMLFormElement: 'FORM',
  HTMLIFrameElement: 'IFRAME',
  HTMLImageElement: 'IMG',
  HTMLLabelElement: 'LABEL',
  HTMLOptionElement: 'OPTION',
  HTMLTableElement: 'TABLE',
  HTMLTableRowElement: 'TR',
  HTMLTableCellElement: 'TD',
  HTMLUListElement: 'UL',
  HTMLOListElement: 'OL',
  HTMLLIElement: 'LI',
  HTMLParagraphElement: 'P',
  HTMLHeadingElement: '',
  HTMLPreElement: 'PRE',
  HTMLCanvasElement: 'CANVAS',
  HTMLVideoElement: 'VIDEO',
  HTMLAudioElement: 'AUDIO',
  HTMLSourceElement: 'SOURCE',
  HTMLScriptElement: 'SCRIPT',
  HTMLStyleElement: 'STYLE',
  HTMLLinkElement: 'LINK',
  HTMLMetaElement: 'META',
  HTMLBodyElement: 'BODY',
  HTMLHeadElement: 'HEAD',
  HTMLHtmlElement: 'HTML',
  HTMLTemplateElement: 'TEMPLATE',
  HTMLSlotElement: 'SLOT',
  HTMLDialogElement: 'DIALOG',
  SVGElement: '',
};

function createHTMLConstructor(tagName: string) {
  const ctor = function () {} as any;
  Object.defineProperty(ctor, Symbol.hasInstance, {
    value: (obj: unknown) => {
      if (!(obj instanceof Element)) return false;
      if (!tagName) return true;
      return (obj as any).tagName === tagName;
    },
  });
  return ctor;
}

const HTML_CONSTRUCTORS_MAP: Record<string, any> = {};
for (const [name, tag] of Object.entries(TAG_MAP)) {
  HTML_CONSTRUCTORS_MAP[name] = createHTMLConstructor(tag);
}

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
  // HTML element constructors with Symbol.hasInstance for correct instanceof
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

      // Install instance-specific values
      t['window'] = window;
      t['document'] = document;
      t['navigator'] = window.navigator;
      t['location'] = window.location;
      t['localStorage'] = localStorage;
      t['sessionStorage'] = sessionStorage;
      t['setTimeout'] = boundSetTimeout;
      t['clearTimeout'] = boundClearTimeout;
      t['setInterval'] = boundSetInterval;
      t['clearInterval'] = boundClearInterval;
      t['requestAnimationFrame'] = boundRaf;
      t['cancelAnimationFrame'] = boundCaf;

      // Install static globals (event classes, observer classes, DOM constructors)
      Object.assign(t, STATIC_GLOBALS);

      // Also set on window object so `win.HTMLIFrameElement` works (React uses this)
      Object.assign(window, STATIC_GLOBALS);

      // Install getComputedStyle and matchMedia from the window
      t['getComputedStyle'] = window.getComputedStyle.bind(window);
      t['matchMedia'] = window.matchMedia.bind(window);
    },

    uninstallGlobals(target?: object): void {
      assertNotDestroyed();
      const t = (target ?? globalThis) as Record<string, unknown>;

      const originals = savedOriginals.get(t);
      if (!originals) return;

      for (const [key, original] of originals) {
        if (original === NOT_SET) {
          delete t[key];
        } else {
          t[key] = original;
        }
      }

      savedOriginals.delete(t);
    },
  };

  return env;
}
