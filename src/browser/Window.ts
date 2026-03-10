/**
 * Window — the global browser context for the Dixie DOM engine.
 *
 * Extends EventTarget to support window-level event handling (resize,
 * popstate, etc.). Aggregates Location, History, Navigator, and Screen
 * as sub-objects. Provides stubs for all commonly-accessed window APIs
 * that React and typical web apps expect to exist.
 */

import { EventTarget } from '../events/EventTarget';
import { Location } from './Location';
import { History } from './History';
import { Navigator } from './Navigator';
import { Screen } from './Screen';
import { EventSourceStub } from '../network/sse';
import { WebSocketStub } from '../network/websocket';
import { DOMParser as DOMParserStub } from './DOMParser';

export { EventTarget };

export interface WindowOptions {
  url?: string;
  innerWidth?: number;
  innerHeight?: number;
  devicePixelRatio?: number;
}

export class Window extends EventTarget {
  // ── Sub-objects ────────────────────────────────────────────────────

  document: any = null;
  readonly location: Location;
  readonly history: History;
  readonly navigator: Navigator;
  readonly screen: Screen;

  // ── Viewport ──────────────────────────────────────────────────────

  innerWidth: number;
  innerHeight: number;
  outerWidth: number;
  outerHeight: number;
  devicePixelRatio: number;

  // ── Scroll ────────────────────────────────────────────────────────

  scrollX: number = 0;
  scrollY: number = 0;

  // ── Identity ──────────────────────────────────────────────────────

  readonly name: string = '';
  readonly closed: boolean = false;
  readonly frameElement: null = null;

  constructor(options?: WindowOptions) {
    super();

    this.location = new Location(options?.url ?? 'about:blank');

    this.history = new History();
    this.history._window = this;

    this.navigator = new Navigator();
    this.screen = new Screen();

    this.innerWidth = options?.innerWidth ?? 1024;
    this.innerHeight = options?.innerHeight ?? 768;
    this.outerWidth = this.innerWidth;
    this.outerHeight = this.innerHeight;
    this.devicePixelRatio = options?.devicePixelRatio ?? 1;
  }

  // ── Self-references ───────────────────────────────────────────────

  get self(): this {
    return this;
  }

  get window(): this {
    return this;
  }

  get globalThis(): this {
    return this;
  }

  get top(): this {
    return this;
  }

  get parent(): this {
    return this;
  }

  get frames(): this {
    return this;
  }

  // ── Scroll aliases ────────────────────────────────────────────────

  get pageXOffset(): number {
    return this.scrollX;
  }

  get pageYOffset(): number {
    return this.scrollY;
  }

  // ── Scroll methods ────────────────────────────────────────────────

  scrollTo(x: number, y: number): void {
    this.scrollX = x;
    this.scrollY = y;
  }

  scroll(x: number, y: number): void {
    this.scrollTo(x, y);
  }

  scrollBy(dx: number, dy: number): void {
    this.scrollX += dx;
    this.scrollY += dy;
  }

  // ── Computed style ────────────────────────────────────────────────

  getComputedStyle(_element: unknown): Record<string, string> {
    // Return a Proxy that returns '' for any property access
    return new Proxy(
      {} as Record<string, string>,
      {
        get(_target, prop) {
          if (prop === Symbol.toPrimitive || prop === Symbol.toStringTag) {
            return undefined;
          }
          if (typeof prop === 'string') {
            return '';
          }
          return undefined;
        },
      },
    );
  }

  // ── matchMedia ────────────────────────────────────────────────────

  matchMedia(query: string): {
    matches: boolean;
    media: string;
    onchange: null;
    addListener: (cb: unknown) => void;
    removeListener: (cb: unknown) => void;
    addEventListener: (type: string, cb: unknown) => void;
    removeEventListener: (type: string, cb: unknown) => void;
    dispatchEvent: (event: unknown) => boolean;
  } {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    };
  }

  // ── Encoding ──────────────────────────────────────────────────────

  atob(encoded: string): string {
    return Buffer.from(encoded, 'base64').toString('binary');
  }

  btoa(data: string): string {
    return Buffer.from(data, 'binary').toString('base64');
  }

  // ── Timers (delegated to global — overridden by DixieEnvironment) ──

  setTimeout(fn: (...args: any[]) => void, delay?: number, ...args: any[]): ReturnType<typeof globalThis.setTimeout> {
    return globalThis.setTimeout(fn, delay, ...args);
  }

  clearTimeout(id: ReturnType<typeof globalThis.setTimeout>): void {
    globalThis.clearTimeout(id);
  }

  setInterval(fn: (...args: any[]) => void, delay?: number, ...args: any[]): ReturnType<typeof globalThis.setInterval> {
    return globalThis.setInterval(fn, delay, ...args);
  }

  clearInterval(id: ReturnType<typeof globalThis.setInterval>): void {
    globalThis.clearInterval(id);
  }

  // ── Animation frames ──────────────────────────────────────────────

  requestAnimationFrame(callback: (time: number) => void): ReturnType<typeof globalThis.setTimeout> {
    return globalThis.setTimeout(() => callback(Date.now()), 16);
  }

  cancelAnimationFrame(id: ReturnType<typeof globalThis.setTimeout>): void {
    globalThis.clearTimeout(id);
  }

  // ── Selection ─────────────────────────────────────────────────────

  getSelection(): null {
    return null;
  }

  // ── Window lifecycle no-ops ───────────────────────────────────────

  focus(): void {}
  blur(): void {}
  open(): void {}
  close(): void {}
  stop(): void {}

  // ── Dialog stubs ──────────────────────────────────────────────────

  alert(_message?: string): void {}

  confirm(_message?: string): boolean {
    return false;
  }

  prompt(_message?: string, _defaultValue?: string): null {
    return null;
  }

  // ── Performance ───────────────────────────────────────────────────

  readonly performance: { now(): number } = {
    now: () => Date.now(),
  };

  // ── Custom elements ───────────────────────────────────────────────

  readonly customElements: {
    define(name: string, constructor: unknown, options?: unknown): void;
    get(name: string): undefined;
    whenDefined(name: string): Promise<void>;
  } = {
    define: () => {},
    get: () => undefined,
    whenDefined: () => Promise.resolve(),
  };

  // ── Microtask ─────────────────────────────────────────────────────

  queueMicrotask(fn: () => void): void {
    queueMicrotask(fn);
  }

  // ── Network stubs ───────────────────────────────────────────────

  readonly EventSource = EventSourceStub;
  readonly WebSocket = WebSocketStub;
  readonly DOMParser = DOMParserStub;

  // ── DOM constructors exposed on window ─────────────────────────

  readonly EventTarget = EventTarget;

  // ── Structured clone ──────────────────────────────────────────────

  structuredClone<T>(obj: T): T {
    if (typeof globalThis.structuredClone === 'function') {
      return globalThis.structuredClone(obj);
    }
    // Fallback for environments without native structuredClone
    return JSON.parse(JSON.stringify(obj));
  }
}
