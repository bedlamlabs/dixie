/**
 * DixieRequest — Minimal Request implementation for the CLI browser.
 *
 * Supports url, method, headers, body, signal. Provides json(), text(), clone().
 */

import { DixieHeaders } from './Headers';

export interface DixieRequestInit {
  method?: string;
  headers?: Record<string, string> | [string, string][] | DixieHeaders;
  body?: string | null;
  signal?: AbortSignal | null;
}

export class DixieRequest {
  readonly url: string;
  readonly method: string;
  readonly headers: DixieHeaders;
  readonly body: string | null;
  readonly signal: AbortSignal | null;

  private _bodyUsed = false;

  constructor(input: string | DixieRequest, init?: DixieRequestInit) {
    if (input instanceof DixieRequest) {
      this.url = input.url;
      this.method = init?.method ?? input.method;
      this.headers = new DixieHeaders(init?.headers ?? input.headers);
      this.body = init?.body !== undefined ? init.body : input.body;
      this.signal = init?.signal !== undefined ? init.signal : input.signal;
    } else {
      this.url = input;
      this.method = init?.method?.toUpperCase() ?? 'GET';
      this.headers = new DixieHeaders(init?.headers);
      this.body = init?.body ?? null;
      this.signal = init?.signal ?? null;
    }
  }

  get bodyUsed(): boolean {
    return this._bodyUsed;
  }

  async json(): Promise<any> {
    this._bodyUsed = true;
    if (this.body === null) {
      throw new Error('Body is null');
    }
    return JSON.parse(this.body);
  }

  async text(): Promise<string> {
    this._bodyUsed = true;
    return this.body ?? '';
  }

  clone(): DixieRequest {
    if (this._bodyUsed) {
      throw new Error('Cannot clone a request whose body has already been consumed');
    }
    return new DixieRequest(this.url, {
      method: this.method,
      headers: this.headers,
      body: this.body,
      signal: this.signal,
    });
  }
}
