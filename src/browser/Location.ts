/**
 * Location — models window.location with full URL parsing.
 *
 * Backed by the native URL class. Setting any individual component
 * (pathname, search, hash, etc.) re-derives the full href. Setting
 * href re-parses all components.
 */

export class Location {
  private _url: URL;

  constructor(href: string = 'about:blank') {
    this._url = new URL(href);
  }

  // ── href (the master property) ─────────────────────────────────────

  get href(): string {
    return this._url.href;
  }

  set href(value: string) {
    this._url = new URL(value);
  }

  // ── Derived read/write properties ──────────────────────────────────

  get protocol(): string {
    return this._url.protocol;
  }

  set protocol(value: string) {
    this._url.protocol = value;
  }

  get host(): string {
    return this._url.host;
  }

  set host(value: string) {
    this._url.host = value;
  }

  get hostname(): string {
    return this._url.hostname;
  }

  set hostname(value: string) {
    this._url.hostname = value;
  }

  get port(): string {
    return this._url.port;
  }

  set port(value: string) {
    this._url.port = value;
  }

  get pathname(): string {
    return this._url.pathname;
  }

  set pathname(value: string) {
    this._url.pathname = value;
  }

  get search(): string {
    return this._url.search;
  }

  set search(value: string) {
    this._url.search = value;
  }

  get hash(): string {
    return this._url.hash;
  }

  set hash(value: string) {
    this._url.hash = value;
  }

  get origin(): string {
    return this._url.origin;
  }

  // ── Methods ────────────────────────────────────────────────────────

  assign(url: string): void {
    this.href = url;
  }

  replace(url: string): void {
    this.href = url;
  }

  reload(): void {
    // No-op in Dixie
  }

  toString(): string {
    return this.href;
  }
}
