import * as vm from 'node:vm';
import { createDixieEnvironment } from '../environment';
import type { DixieEnvironment } from '../environment';
import { MockFetch } from '../fetch/MockFetch';
import type { HarRecorder } from '../har/recorder';
import { Event } from '../events/Event';
import { CustomEvent } from '../events/CustomEvent';
import { MouseEvent } from '../events/MouseEvent';
import { KeyboardEvent } from '../events/KeyboardEvent';
import { InputEvent } from '../events/InputEvent';
import { FocusEvent } from '../events/FocusEvent';
import { MutationObserver } from '../observers/MutationObserver';

/**
 * Minimal FileReader shim — Node.js does not expose FileReader as a global.
 * Supports readAsText, readAsArrayBuffer, readAsDataURL with async Blob methods.
 */
class FileReaderShim {
  static readonly EMPTY = 0;
  static readonly LOADING = 1;
  static readonly DONE = 2;
  readonly EMPTY = 0;
  readonly LOADING = 1;
  readonly DONE = 2;
  readyState = 0;
  result: string | ArrayBuffer | null = null;
  error: any = null;
  onload: ((ev: any) => void) | null = null;
  onerror: ((ev: any) => void) | null = null;
  onloadend: ((ev: any) => void) | null = null;
  onabort: ((ev: any) => void) | null = null;
  onloadstart: ((ev: any) => void) | null = null;
  onprogress: ((ev: any) => void) | null = null;

  readAsText(blob: Blob) { this._read(blob, 'text'); }
  readAsArrayBuffer(blob: Blob) { this._read(blob, 'arraybuffer'); }
  readAsDataURL(blob: Blob) { this._read(blob, 'dataurl'); }
  abort() { /* no-op for VM shim */ }

  private async _read(blob: Blob, type: 'text' | 'arraybuffer' | 'dataurl') {
    this.readyState = 1;
    try {
      if (type === 'text') {
        this.result = await blob.text();
      } else if (type === 'arraybuffer') {
        this.result = await blob.arrayBuffer();
      } else {
        const buf = await blob.arrayBuffer();
        this.result = 'data:' + (blob.type || 'application/octet-stream') + ';base64,' +
          Buffer.from(buf).toString('base64');
      }
      this.readyState = 2;
      if (this.onload) this.onload({ target: this });
    } catch (e) {
      this.error = e;
      if (this.onerror) this.onerror({ target: this });
    }
    if (this.onloadend) this.onloadend({ target: this });
  }
}

/**
 * No-op XMLHttpRequest shim — some third-party scripts (Google Sign-In, analytics)
 * fall back to XHR when fetch is unavailable or for legacy compat. This shim prevents
 * "XMLHttpRequest is not defined" crashes without making real network calls.
 */
class XMLHttpRequestShim {
  static readonly UNSENT = 0;
  static readonly OPENED = 1;
  static readonly HEADERS_RECEIVED = 2;
  static readonly LOADING = 3;
  static readonly DONE = 4;
  readyState = 0;
  status = 0;
  statusText = '';
  responseText = '';
  response = '';
  responseType = '';
  onload: ((ev: any) => void) | null = null;
  onerror: ((ev: any) => void) | null = null;
  onreadystatechange: ((ev: any) => void) | null = null;
  open() { this.readyState = 1; }
  send() { this.readyState = 4; this.status = 0; }
  setRequestHeader() {}
  getResponseHeader() { return null; }
  getAllResponseHeaders() { return ''; }
  abort() {}
  addEventListener() {}
  removeEventListener() {}
}

export interface VmContextOptions {
  timeout?: number;
  url?: string;
  /** Optional HAR recorder — when provided, in-page fetch() calls are recorded. */
  harRecorder?: HarRecorder;
}

export interface ScriptResult {
  error?: string;
}

export interface VmContext {
  document: any;
  window: any;
  /** Alias for window — the raw vm sandbox object */
  sandbox: Record<string, any>;
  executeScript: (code: string) => ScriptResult;
  env: DixieEnvironment;
  /** The MockFetch instance for registering routes in the vm sandbox */
  mockFetch: MockFetch;
}

/**
 * SECURITY: This sandbox is NOT an isolation boundary.
 * Rendered page code can access the host Node.js process via prototype chain escape.
 * Node's `vm` module is explicitly not a security sandbox — even vm2 (purpose-built)
 * was abandoned due to unfixable escapes.
 *
 * Only render pages from sources you trust.
 */
export function createVmContext(envOrOptions?: DixieEnvironment | VmContextOptions): VmContext {
  let env: DixieEnvironment;
  let timeout = 5000;
  let harRecorder: HarRecorder | undefined;

  if (envOrOptions && 'document' in envOrOptions && 'window' in envOrOptions) {
    // Called with an existing DixieEnvironment
    env = envOrOptions as DixieEnvironment;
  } else {
    const options = envOrOptions as VmContextOptions | undefined;
    env = createDixieEnvironment({ url: options?.url ?? 'http://localhost/' });
    const rawTimeout = options?.timeout ?? 5000;
    // Guard: reject NaN, Infinity, <= 0, or non-number — fall back to default 5000ms
    timeout = (typeof rawTimeout === 'number' && Number.isFinite(rawTimeout) && rawTimeout > 0)
      ? rawTimeout
      : 5000;
    harRecorder = options?.harRecorder;
  }
  const win = env.window;

  // Create a MockFetch instance for the vm sandbox — isolated from RenderContext's fetch
  const mockFetch = new MockFetch();

  /**
   * The sandbox IS the global scope for vm.runInContext.
   * Every global that React, Vite bundles, or React Router expect must be
   * present here. Missing globals produce silent failures at runtime.
   *
   * window === globalThis === self === sandbox (as in browsers).
   */
  const sandbox: Record<string, any> = {
    // ── DOM ────────────────────────────────────────────────────────────
    document: env.document,

    // ── Console ────────────────────────────────────────────────────────
    console: (win as any).console ?? console,

    // ── Timers ─────────────────────────────────────────────────────────
    // Use real Node timers so that async React scheduling can flush
    setTimeout: globalThis.setTimeout,
    setInterval: globalThis.setInterval,
    clearTimeout: globalThis.clearTimeout,
    clearInterval: globalThis.clearInterval,

    // ── Animation frame ────────────────────────────────────────────────
    // React scheduler falls back to rAF when MessageChannel is unavailable
    requestAnimationFrame: (callback: (time: number) => void) =>
      globalThis.setTimeout(() => callback(Date.now()), 16),
    cancelAnimationFrame: (id: ReturnType<typeof globalThis.setTimeout>) =>
      globalThis.clearTimeout(id),

    // ── Microtask ──────────────────────────────────────────────────────
    queueMicrotask: globalThis.queueMicrotask,

    // ── MessageChannel ─────────────────────────────────────────────────
    // React 18 scheduler uses MessageChannel for priority task scheduling
    MessageChannel: globalThis.MessageChannel,
    MessageEvent: globalThis.MessageEvent,

    // ── Event listeners (window.addEventListener used by React Router) ──
    // Bind to env.window (EventTarget subclass) so listeners actually work.
    addEventListener: (type: string, listener: any, options?: any) =>
      (win as any).addEventListener(type, listener, options),
    removeEventListener: (type: string, listener: any, options?: any) =>
      (win as any).removeEventListener(type, listener, options),
    dispatchEvent: (event: any) => (win as any).dispatchEvent(event),

    // ── Location, History, Navigator ───────────────────────────────────
    location: (win as any).location,
    history: (win as any).history,
    navigator: (win as any).navigator,
    screen: (win as any).screen,

    // ── URL ────────────────────────────────────────────────────────────
    URL: globalThis.URL,
    URLSearchParams: globalThis.URLSearchParams,

    // ── Fetch & Networking ─────────────────────────────────────────────
    // Use MockFetch so sandbox scripts cannot make real network calls
    // and route registrations work correctly within the vm sandbox.
    // If a harRecorder was provided, wrap fetch to record in-page network calls.
    fetch: harRecorder
      ? async (input: any, init?: any) => {
          const start = performance.now();
          const response = await mockFetch.fetch(input, init);
          const durationMs = performance.now() - start;
          // Clone so the caller can still consume the body
          const clone = response.clone();
          const body = await clone.text().catch(() => '');
          harRecorder!.record({
            method: init?.method ?? 'GET',
            url: typeof input === 'string' ? input : input?.url ?? String(input),
            status: response.status,
            responseBody: body,
            durationMs: Math.round(durationMs * 100) / 100,
          });
          return response;
        }
      : (input: any, init?: any) => mockFetch.fetch(input, init),
    Headers: globalThis.Headers,
    Request: globalThis.Request,
    Response: globalThis.Response,
    AbortController: globalThis.AbortController,
    AbortSignal: globalThis.AbortSignal,

    // ── Encoding ───────────────────────────────────────────────────────
    TextEncoder: globalThis.TextEncoder,
    TextDecoder: globalThis.TextDecoder,

    // ── Crypto ─────────────────────────────────────────────────────────
    // React and router internals use crypto.getRandomValues for key generation
    crypto: globalThis.crypto,

    // ── Performance ────────────────────────────────────────────────────
    performance: globalThis.performance,

    // ── DOM Event constructors ─────────────────────────────────────────
    // Use Dixie's implementations so they interop with the Dixie EventTarget
    Event,
    CustomEvent,
    MouseEvent,
    KeyboardEvent,
    InputEvent,
    FocusEvent,

    // ── Observers ──────────────────────────────────────────────────────
    // MutationObserver — React uses it to detect disconnected subtrees
    MutationObserver,

    // ── Web Storage ──────────────────────────────────────────────────
    // Use the environment's storage instances so SPA code that references
    // localStorage/sessionStorage doesn't crash the VM.
    localStorage: env.localStorage,
    sessionStorage: env.sessionStorage,

    // ── Structured clone ───────────────────────────────────────────────
    structuredClone: globalThis.structuredClone,

    // ── Error constructors ─────────────────────────────────────────────
    Error: globalThis.Error,
    TypeError: globalThis.TypeError,
    RangeError: globalThis.RangeError,
    SyntaxError: globalThis.SyntaxError,
    ReferenceError: globalThis.ReferenceError,
    EvalError: globalThis.EvalError,
    URIError: globalThis.URIError,

    // ── Standard globals ───────────────────────────────────────────────
    Promise: globalThis.Promise,
    JSON: globalThis.JSON,
    Math: globalThis.Math,
    Object: globalThis.Object,
    Array: globalThis.Array,
    Map: globalThis.Map,
    Set: globalThis.Set,
    WeakMap: globalThis.WeakMap,
    WeakSet: globalThis.WeakSet,
    Symbol: globalThis.Symbol,
    Proxy: globalThis.Proxy,
    Reflect: globalThis.Reflect,
    RegExp: globalThis.RegExp,
    Date: globalThis.Date,
    parseInt: globalThis.parseInt,
    parseFloat: globalThis.parseFloat,
    isNaN: globalThis.isNaN,
    isFinite: globalThis.isFinite,
    decodeURIComponent: globalThis.decodeURIComponent,
    encodeURIComponent: globalThis.encodeURIComponent,
    decodeURI: globalThis.decodeURI,
    encodeURI: globalThis.encodeURI,

    // ── Binary / File APIs ───────────────────────────────────────────
    // Required by SPA code that creates blobs (email preview, file uploads),
    // Maxwell widget (localStorage + Blob), and automations page.
    Blob: globalThis.Blob,
    File: globalThis.File,
    FormData: globalThis.FormData,
    FileReader: FileReaderShim,

    // ── Base64 encoding ──────────────────────────────────────────────
    btoa: globalThis.btoa,
    atob: globalThis.atob,

    // ── Legacy networking ────────────────────────────────────────────
    // Third-party scripts (Google Sign-In, analytics) may reference XHR
    XMLHttpRequest: XMLHttpRequestShim,
  };

  // window === globalThis === self === sandbox (browser behaviour).
  // Intentional: browsers define window.window === window. This circular reference
  // is required for browser-compat code that accesses window.window or self.self.
  // env.window is NOT overwritten — it remains the Dixie EventTarget instance.
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.top = sandbox;
  sandbox.parent = sandbox;
  sandbox.frames = sandbox;

  // ── DOM constructors from DixieEnvironment ──────────────────────────
  // createDixieEnvironment() assigns STATIC_GLOBALS to env.window, which includes
  // Node, Element, all HTML*Element constructors (with Symbol.hasInstance), DOM
  // observers, and event classes. Install any that aren't already in the sandbox
  // so that `x instanceof HTMLInputElement` etc. work inside bundled SPA code.
  const DOM_CONSTRUCTOR_NAMES = [
    'Node', 'Element', 'Document', 'DocumentFragment', 'Text', 'Comment',
    'EventTarget', 'DOMParser', 'NodeFilter',
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
    'ResizeObserver', 'IntersectionObserver',
    'UIEvent', 'PointerEvent',
  ];
  for (const name of DOM_CONSTRUCTOR_NAMES) {
    if (!(name in sandbox) && (win as any)[name]) {
      sandbox[name] = (win as any)[name];
    }
  }

  // ── Layout queries ──────────────────────────────────────────────────
  // React and CSS-in-JS libraries call getComputedStyle and matchMedia
  if ((win as any).getComputedStyle) {
    sandbox.getComputedStyle = (win as any).getComputedStyle.bind(win);
  }
  if ((win as any).matchMedia) {
    sandbox.matchMedia = (win as any).matchMedia.bind(win);
  }

  const context = vm.createContext(sandbox);

  function executeScript(code: string): ScriptResult {
    try {
      vm.runInContext(code, context, { timeout });
      return {};
    } catch (err: any) {
      const msg = err.message ?? String(err);
      // Re-throw timeouts so callers can handle them
      if (err.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT' || /timed out/i.test(msg)) {
        const timeoutErr = new Error(`Script timeout after ${timeout}ms`);
        (timeoutErr as any).code = 'ERR_SCRIPT_EXECUTION_TIMEOUT';
        throw timeoutErr;
      }
      return { error: msg };
    }
  }

  return {
    document: env.document,
    window: sandbox,
    sandbox,
    executeScript,
    env,
    mockFetch,
  };
}
