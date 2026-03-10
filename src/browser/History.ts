/**
 * History — models window.history with pushState/replaceState and
 * back/forward/go navigation.
 *
 * Maintains an internal stack of entries. Navigation dispatches a
 * 'popstate' event on the associated window (if one is linked).
 *
 * pushState and replaceState update window.location to match the new URL,
 * mirroring real browser behavior where the History API and Location are coupled.
 */

import { Event } from '../events/Event';

interface HistoryEntry {
  state: unknown;
  title: string;
  url: string | null;
}

export class History {
  private _entries: HistoryEntry[] = [{ state: null, title: '', url: null }];
  private _index: number = 0;

  /** Link to the parent window — set externally by Window constructor. */
  _window: any = null;

  get length(): number {
    return this._entries.length;
  }

  get state(): unknown {
    return this._entries[this._index].state;
  }

  pushState(state: unknown, title: string, url?: string | null): void {
    // Truncate forward entries
    this._entries = this._entries.slice(0, this._index + 1);
    this._entries.push({
      state: state !== undefined ? state : null,
      title,
      url: url ?? null,
    });
    this._index = this._entries.length - 1;

    // Sync location with the new URL (mirrors real browser behavior)
    if (url != null && this._window?.location) {
      this._syncLocation(url);
    }
  }

  replaceState(state: unknown, title: string, url?: string | null): void {
    this._entries[this._index] = {
      state: state !== undefined ? state : null,
      title,
      url: url ?? null,
    };

    // Sync location with the new URL
    if (url != null && this._window?.location) {
      this._syncLocation(url);
    }
  }

  back(): void {
    this.go(-1);
  }

  forward(): void {
    this.go(1);
  }

  go(delta?: number): void {
    if (delta === undefined || delta === 0) return;

    const newIndex = this._index + delta;
    if (newIndex < 0 || newIndex >= this._entries.length) return;

    this._index = newIndex;

    // Sync location with the navigated-to entry's URL
    const entry = this._entries[this._index];
    if (entry.url != null && this._window?.location) {
      this._syncLocation(entry.url);
    }

    // Dispatch popstate event on the associated window
    if (this._window) {
      const popstateEvent = new Event('popstate', { bubbles: false, cancelable: false });
      (popstateEvent as any).state = this._entries[this._index].state;
      this._window.dispatchEvent(popstateEvent);
    }
  }

  /** Update window.location to reflect a History URL change. */
  private _syncLocation(url: string): void {
    const loc = this._window.location;
    if (!loc) return;

    // URL can be absolute or relative (path-only like "/app/dashboard")
    try {
      const resolved = new URL(url, loc.href);
      // Only update pathname/search/hash — don't change origin
      loc.pathname = resolved.pathname;
      loc.search = resolved.search;
      loc.hash = resolved.hash;
    } catch {
      // Invalid URL — silently ignore per browser behavior
    }
  }
}
