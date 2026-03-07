/**
 * DixieResponse — Minimal Response implementation for the CLI browser.
 *
 * Supports status, statusText, ok, headers, url, bodyUsed.
 * Provides json(), text(), blob(), arrayBuffer(), clone().
 * Static helpers: json(), error(), redirect().
 */

import { DixieHeaders } from './Headers';

export interface DixieResponseInit {
  status?: number;
  statusText?: string;
  headers?: Record<string, string> | [string, string][] | DixieHeaders;
  url?: string;
}

export class DixieResponse {
  readonly status: number;
  readonly statusText: string;
  readonly headers: DixieHeaders;
  readonly url: string;
  readonly redirected: boolean = false;
  readonly type: string = 'basic';

  private _body: string | null;
  private _bodyUsed = false;

  constructor(body?: string | null, init?: DixieResponseInit) {
    this._body = body ?? null;
    this.status = init?.status ?? 200;
    this.statusText = init?.statusText ?? 'OK';
    this.headers = new DixieHeaders(init?.headers);
    this.url = init?.url ?? '';
  }

  get ok(): boolean {
    return this.status >= 200 && this.status <= 299;
  }

  get bodyUsed(): boolean {
    return this._bodyUsed;
  }

  async json(): Promise<any> {
    if (this._bodyUsed) {
      throw new Error('Body has already been consumed');
    }
    this._bodyUsed = true;
    if (this._body === null) {
      throw new Error('Body is null');
    }
    return JSON.parse(this._body);
  }

  async text(): Promise<string> {
    if (this._bodyUsed) {
      throw new Error('Body has already been consumed');
    }
    this._bodyUsed = true;
    return this._body ?? '';
  }

  async blob(): Promise<{ size: number; type: string; text(): Promise<string> }> {
    if (this._bodyUsed) {
      throw new Error('Body has already been consumed');
    }
    this._bodyUsed = true;
    const content = this._body ?? '';
    const contentType = this.headers.get('content-type') ?? '';
    return {
      size: content.length,
      type: contentType,
      text: async () => content,
    };
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    if (this._bodyUsed) {
      throw new Error('Body has already been consumed');
    }
    this._bodyUsed = true;
    const content = this._body ?? '';
    const encoder = new TextEncoder();
    return encoder.encode(content).buffer as ArrayBuffer;
  }

  clone(): DixieResponse {
    if (this._bodyUsed) {
      throw new Error('Cannot clone a response whose body has already been consumed');
    }
    const cloned = new DixieResponse(this._body, {
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
      url: this.url,
    });
    return cloned;
  }

  // ─── Static factory methods ────────────────────────────────────────

  static json(data: any, init?: DixieResponseInit): DixieResponse {
    const body = JSON.stringify(data);
    const headers = new DixieHeaders(init?.headers);
    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }
    return new DixieResponse(body, {
      status: init?.status ?? 200,
      statusText: init?.statusText ?? 'OK',
      headers,
      url: init?.url,
    });
  }

  static error(): DixieResponse {
    const resp = new DixieResponse(null, {
      status: 0,
      statusText: '',
    });
    // Overwrite type — error responses have type 'error'
    (resp as any).type = 'error';
    return resp;
  }

  static redirect(url: string, status = 302): DixieResponse {
    if (![301, 302, 303, 307, 308].includes(status)) {
      throw new RangeError(`Invalid redirect status: ${status}`);
    }
    return new DixieResponse(null, {
      status,
      statusText: 'Found',
      headers: { location: url },
    });
  }
}
