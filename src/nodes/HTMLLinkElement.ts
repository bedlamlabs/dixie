import { Element } from './Element';
import { Event } from '../events/Event';
import { DOMTokenList } from '../collections/DOMTokenList';

/** rel values a browser's `link.relList.supports()` reports as supported. */
const SUPPORTED_REL_TOKENS = new Set([
  'alternate', 'dns-prefetch', 'icon', 'manifest', 'modulepreload', 'next',
  'preconnect', 'prefetch', 'preload', 'prev', 'search', 'stylesheet',
]);

/** rel values whose resource load a browser reports with a load event. */
const LOADING_REL_TOKENS = new Set(['stylesheet', 'preload', 'modulepreload']);

/**
 * HTMLLinkElement — a <link> element.
 *
 * Vite production bundles depend on three browser behaviours here:
 * - `link.relList.supports('modulepreload')` — when false, Vite's polyfill
 *   runs and calls `fetch(link.href)` for every preload link;
 * - `link.href` — the resolved absolute URL, compared against dependency
 *   URLs so already-present chunks are not preloaded twice;
 * - a `load` event on stylesheet links — the lazy-route preload helper waits
 *   for it before importing the route chunk. Without it, every lazy route
 *   stays pending forever.
 *
 * Dixie does not apply stylesheets or preload chunks (chunks are bundled
 * into the entry), so the load event is dispatched once the link is
 * connected, marking the resource as settled.
 */
export class HTMLLinkElement extends Element {
  private _relList: DOMTokenList | null = null;
  private _loadDispatched = false;

  constructor() {
    super('link');
  }

  get href(): string {
    const raw = this.getAttribute('href');
    if (raw === null) return '';
    const base = (this.ownerDocument as any)?.defaultView?.location?.href;
    try {
      return new URL(raw, base).href;
    } catch {
      return raw;
    }
  }

  set href(v: string) {
    this.setAttribute('href', v);
  }

  get rel(): string {
    return this.getAttribute('rel') ?? '';
  }

  set rel(v: string) {
    this.setAttribute('rel', v);
  }

  get relList(): DOMTokenList {
    if (!this._relList) {
      const list = new DOMTokenList(
        () => this.getAttribute('rel') ?? '',
        (value: string) => this.setAttribute('rel', value),
      );
      (list as any).supports = (token: string) => SUPPORTED_REL_TOKENS.has(String(token).toLowerCase());
      this._relList = list;
    }
    return this._relList;
  }

  get as(): string {
    return this.getAttribute('as') ?? '';
  }

  set as(v: string) {
    this.setAttribute('as', v);
  }

  /** Reflects the crossorigin attribute; null when absent, as in browsers. */
  get crossOrigin(): string | null {
    const v = this.getAttribute('crossorigin');
    if (v === null) return null;
    return v.toLowerCase() === 'use-credentials' ? 'use-credentials' : 'anonymous';
  }

  set crossOrigin(v: string | null) {
    if (v === null) this.removeAttribute('crossorigin');
    else this.setAttribute('crossorigin', v);
  }

  get integrity(): string {
    return this.getAttribute('integrity') ?? '';
  }

  set integrity(v: string) {
    this.setAttribute('integrity', v);
  }

  get referrerPolicy(): string {
    return this.getAttribute('referrerpolicy') ?? '';
  }

  set referrerPolicy(v: string) {
    this.setAttribute('referrerpolicy', v);
  }

  get media(): string {
    return this.getAttribute('media') ?? '';
  }

  set media(v: string) {
    this.setAttribute('media', v);
  }

  get type(): string {
    return this.getAttribute('type') ?? '';
  }

  set type(v: string) {
    this.setAttribute('type', v);
  }

  /** Called by Node after this element is inserted into a parent. */
  _onInserted(): void {
    if (this._loadDispatched || !this.isConnected || !this.hasAttribute('href')) return;
    const loads = this.rel.toLowerCase().split(/\s+/).some((t) => LOADING_REL_TOKENS.has(t));
    if (!loads) return;
    this._loadDispatched = true;
    // Asynchronous, as in browsers: listeners attached right after
    // appendChild() must still see the event.
    setTimeout(() => {
      const event = new Event('load');
      this.dispatchEvent(event);
      const handler = (this as any).onload;
      if (typeof handler === 'function') handler.call(this, event);
    }, 0);
  }
}
