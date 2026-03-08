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

// ── Tag mapping for Symbol.hasInstance constructors ──────────────────
// Maps constructor name -> expected tagName. Empty string means "any Element".

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

/**
 * Create a constructor function with Symbol.hasInstance that checks
 * whether the object is a real Element with the expected tagName.
 */
function createHTMLConstructor(tagName: string) {
  const ctor = function () {} as any;
  Object.defineProperty(ctor, Symbol.hasInstance, {
    value: (obj: unknown) => {
      // Must be an actual Element instance (not a plain object)
      if (!(obj instanceof Element)) return false;
      // If tagName is empty (HTMLElement, SVGElement, HTMLHeadingElement), any Element matches
      if (!tagName) return true;
      return (obj as any).tagName === tagName;
    },
  });
  return ctor;
}

// Pre-build all HTML constructors (one per constructor name, reused across installs)
const HTML_CONSTRUCTORS_MAP: Record<string, any> = {};
for (const [name, tag] of Object.entries(TAG_MAP)) {
  HTML_CONSTRUCTORS_MAP[name] = createHTMLConstructor(tag);
}

const HTML_ELEMENT_CONSTRUCTORS = Object.keys(TAG_MAP);

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

/**
 * Safely set a property on a target using Object.defineProperty.
 * Skips non-configurable properties that would throw TypeError.
 * Uses defineProperty instead of direct assignment to avoid triggering
 * getters/setters on non-configurable properties (e.g., Node.js's navigator).
 */
function safeSet(target: Record<string, unknown>, key: string, value: unknown): boolean {
  try {
    Object.defineProperty(target, key, {
      value,
      writable: true,
      configurable: true,
    });
    return true;
  } catch {
    // Property is non-configurable — skip gracefully
    return false;
  }
}

export function installGlobals(env: DixieEnvironment): GlobalInstallation {
  const target = globalThis as Record<string, unknown>;

  // Save originals (both value and full descriptor for proper restore)
  const originals = new Map<string, unknown>();
  const originalDescriptors = new Map<string, PropertyDescriptor | undefined>();
  const installedKeys: string[] = [];

  for (const key of GLOBAL_KEYS) {
    originals.set(key, key in target ? target[key] : NOT_SET);
    originalDescriptors.set(key, Object.getOwnPropertyDescriptor(target, key));
  }

  // Install environment-specific values (skip non-configurable properties)
  if (safeSet(target, 'window', env.window)) installedKeys.push('window');
  if (safeSet(target, 'document', env.document)) installedKeys.push('document');
  if (safeSet(target, 'navigator', env.navigator)) installedKeys.push('navigator');
  if (safeSet(target, 'localStorage', env.localStorage)) installedKeys.push('localStorage');
  if (safeSet(target, 'sessionStorage', env.sessionStorage)) installedKeys.push('sessionStorage');
  if (safeSet(target, 'location', env.location)) installedKeys.push('location');
  if (safeSet(target, 'history', env.history)) installedKeys.push('history');

  // Install fetch: if the environment has a MockFetch on the window, use it;
  // otherwise use the environment's window as a fetch source or leave native
  if ((env as any)._mockFetch) {
    const mf = (env as any)._mockFetch;
    if (safeSet(target, 'fetch', mf.fetch.bind(mf))) installedKeys.push('fetch');
  }
  // If no mock fetch, don't overwrite native fetch — leave it as-is

  // Install timer functions from the environment's timer controller
  const timers = env.timers;
  safeSet(target, 'setTimeout', timers.setTimeout.bind(timers));
  safeSet(target, 'setInterval', timers.setInterval.bind(timers));
  safeSet(target, 'clearTimeout', timers.clearTimeout.bind(timers));
  safeSet(target, 'clearInterval', timers.clearInterval.bind(timers));
  safeSet(target, 'requestAnimationFrame', timers.requestAnimationFrame.bind(timers));
  safeSet(target, 'cancelAnimationFrame', timers.cancelAnimationFrame.bind(timers));

  // Install event constructors
  safeSet(target, 'Event', Event);
  safeSet(target, 'CustomEvent', CustomEvent);

  // Install DOM constructors
  safeSet(target, 'Node', Node);
  safeSet(target, 'Document', Document);
  safeSet(target, 'DocumentFragment', DocumentFragment);
  safeSet(target, 'Text', Text);
  safeSet(target, 'Comment', Comment);

  // Install HTML element constructors with Symbol.hasInstance for correct instanceof
  // Set on both globalThis AND env.window so `win.HTMLIFrameElement` works
  for (const name of HTML_ELEMENT_CONSTRUCTORS) {
    const ctor = HTML_CONSTRUCTORS_MAP[name];
    safeSet(target, name, ctor);
    (env.window as any)[name] = ctor;
  }

  // Install observers
  safeSet(target, 'MutationObserver', MutationObserver);
  safeSet(target, 'ResizeObserver', ResizeObserver);
  safeSet(target, 'IntersectionObserver', IntersectionObserver);

  // Install getComputedStyle stub
  safeSet(target, 'getComputedStyle', env.window.getComputedStyle.bind(env.window));

  // Install matchMedia stub
  safeSet(target, 'matchMedia', env.window.matchMedia.bind(env.window));

  // Return installation handle with restore()
  return {
    restore(): void {
      for (const [key, original] of originals) {
        const origDesc = originalDescriptors.get(key);
        try {
          if (original === NOT_SET) {
            delete target[key];
          } else if (origDesc && origDesc.get) {
            // Restore as a getter (not a plain value)
            Object.defineProperty(target, key, origDesc);
          } else {
            target[key] = original;
          }
        } catch {
          // Skip non-restorable properties
        }
      }
    },
  };
}
