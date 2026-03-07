/**
 * History — models window.history with pushState/replaceState and
 * back/forward/go navigation.
 *
 * Maintains an internal stack of entries. Navigation dispatches a
 * 'popstate' event on the associated window (if one is linked).
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
  }

  replaceState(state: unknown, title: string, url?: string | null): void {
    this._entries[this._index] = {
      state: state !== undefined ? state : null,
      title,
      url: url ?? null,
    };
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

    // Dispatch popstate event on the associated window
    if (this._window) {
      const popstateEvent = new Event('popstate', { bubbles: false, cancelable: false });
      (popstateEvent as any).state = this._entries[this._index].state;
      this._window.dispatchEvent(popstateEvent);
    }
  }
}
