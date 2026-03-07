/**
 * installGlobals — install a DixieEnvironment as the global scope.
 *
 * Sets globalThis.window, globalThis.document, globalThis.navigator,
 * and all other browser globals needed for React/testing-library
 * compatibility.
 *
 * Returns a GlobalInstallation with a restore() method that puts
 * original values back.
 */

import type { DixieEnvironment } from './DixieEnvironment';
import { Event } from '../events/Event';
import { CustomEvent } from '../events/CustomEvent';
import { Element } from '../nodes/Element';
import { Node } from '../nodes/Node';
import { Document } from '../nodes/Document';
import { DocumentFragment } from '../nodes/DocumentFragment';
import { Text } from '../nodes/Text';
import { Comment } from '../nodes/Comment';
import { MutationObserver } from '../observers/MutationObserver';
import { ResizeObserver } from '../observers/ResizeObserver';
import { IntersectionObserver } from '../observers/IntersectionObserver';

// ── Types ─────────────────────────────────────────────────────────────

export interface GlobalInstallation {
  /** Undo the installation (restore original globals). */
  restore(): void;
}

// Sentinel for "property did not exist"
const NOT_SET = Symbol('NOT_SET');

// ── All keys we install ───────────────────────────────────────────────

// HTML element constructors that React and libraries check via instanceof.
// All map to Element since we don't need subclass-specific behavior.
const HTML_ELEMENT_CONSTRUCTORS = [
  'HTMLElement',
  'HTMLDivElement',
  'HTMLSpanElement',
  'HTMLAnchorElement',
  'HTMLButtonElement',
  'HTMLInputElement',
  'HTMLTextAreaElement',
  'HTMLSelectElement',
  'HTMLFormElement',
  'HTMLIFrameElement',
  'HTMLImageElement',
  'HTMLLabelElement',
  'HTMLOptionElement',
  'HTMLTableElement',
  'HTMLTableRowElement',
  'HTMLTableCellElement',
  'HTMLUListElement',
  'HTMLOListElement',
  'HTMLLIElement',
  'HTMLParagraphElement',
  'HTMLHeadingElement',
  'HTMLPreElement',
  'HTMLCanvasElement',
  'HTMLVideoElement',
  'HTMLAudioElement',
  'HTMLSourceElement',
  'HTMLScriptElement',
  'HTMLStyleElement',
  'HTMLLinkElement',
  'HTMLMetaElement',
  'HTMLBodyElement',
  'HTMLHeadElement',
  'HTMLHtmlElement',
  'HTMLTemplateElement',
  'HTMLSlotElement',
  'HTMLDialogElement',
  'SVGElement',
] as const;

const GLOBAL_KEYS = [
  'window',
  'document',
  'navigator',
  'localStorage',
  'sessionStorage',
  'location',
  'history',
  'fetch',
  'setTimeout',
  'setInterval',
  'clearTimeout',
  'clearInterval',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'Event',
  'CustomEvent',
  'Node',
  'Document',
  'DocumentFragment',
  'Text',
  'Comment',
  'MutationObserver',
  'ResizeObserver',
  'IntersectionObserver',
  'getComputedStyle',
  'matchMedia',
  ...HTML_ELEMENT_CONSTRUCTORS,
] as const;

// ── Implementation ───────────────────────────────────────────────────

export function installGlobals(env: DixieEnvironment): GlobalInstallation {
  const target = globalThis as Record<string, unknown>;

  // Save originals
  const originals = new Map<string, unknown>();
  for (const key of GLOBAL_KEYS) {
    originals.set(key, key in target ? target[key] : NOT_SET);
  }

  // Install environment-specific values
  target['window'] = env.window;
  target['document'] = env.document;
  target['navigator'] = env.navigator;
  target['localStorage'] = env.localStorage;
  target['sessionStorage'] = env.sessionStorage;
  target['location'] = env.location;
  target['history'] = env.history;

  // Install fetch: if the environment has a MockFetch on the window, use it;
  // otherwise use the environment's window as a fetch source or leave native
  if ((env as any)._mockFetch) {
    const mf = (env as any)._mockFetch;
    target['fetch'] = mf.fetch.bind(mf);
  }
  // If no mock fetch, don't overwrite native fetch — leave it as-is

  // Install timer functions from the environment's timer controller
  const timers = env.timers;
  target['setTimeout'] = timers.setTimeout.bind(timers);
  target['setInterval'] = timers.setInterval.bind(timers);
  target['clearTimeout'] = timers.clearTimeout.bind(timers);
  target['clearInterval'] = timers.clearInterval.bind(timers);
  target['requestAnimationFrame'] = timers.requestAnimationFrame.bind(timers);
  target['cancelAnimationFrame'] = timers.cancelAnimationFrame.bind(timers);

  // Install event constructors
  target['Event'] = Event;
  target['CustomEvent'] = CustomEvent;

  // Install DOM constructors
  target['Node'] = Node;
  target['Document'] = Document;
  target['DocumentFragment'] = DocumentFragment;
  target['Text'] = Text;
  target['Comment'] = Comment;

  // Install HTML element constructors (all map to Element for instanceof checks)
  // Set on both globalThis AND env.window so `win.HTMLIFrameElement` works
  for (const name of HTML_ELEMENT_CONSTRUCTORS) {
    target[name] = Element;
    (env.window as any)[name] = Element;
  }


  // Install observers
  target['MutationObserver'] = MutationObserver;
  target['ResizeObserver'] = ResizeObserver;
  target['IntersectionObserver'] = IntersectionObserver;

  // Install getComputedStyle stub
  target['getComputedStyle'] = env.window.getComputedStyle.bind(env.window);

  // Install matchMedia stub
  target['matchMedia'] = env.window.matchMedia.bind(env.window);

  // Return installation handle with restore()
  return {
    restore(): void {
      for (const [key, original] of originals) {
        if (original === NOT_SET) {
          delete target[key];
        } else {
          target[key] = original;
        }
      }
    },
  };
}
