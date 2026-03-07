export class WebSocketStub {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;

  readonly url: string;
  readonly protocol: string = '';
  readonly extensions: string = '';
  readyState: number = WebSocketStub.CONNECTING;
  bufferedAmount: number = 0;
  binaryType: string = 'blob';

  onopen: ((event: any) => void) | null = null;
  onclose: ((event: any) => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;

  constructor(url: string, _protocols?: string | string[]) {
    this.url = url;
  }

  send(_data: any): void {}

  close(_code?: number, _reason?: string): void {
    this.readyState = WebSocketStub.CLOSED;
  }

  addEventListener(_type: string, _listener: any): void {}
  removeEventListener(_type: string, _listener: any): void {}
  dispatchEvent(_event: any): boolean { return true; }
}
