export class EventSourceStub {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;

  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSED = 2;

  readonly url: string;
  readonly withCredentials: boolean;
  readyState: number = EventSourceStub.CONNECTING;

  onopen: ((event: any) => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;

  constructor(url: string, config?: { withCredentials?: boolean }) {
    this.url = url;
    this.withCredentials = config?.withCredentials ?? false;
  }

  close(): void {
    this.readyState = EventSourceStub.CLOSED;
  }

  addEventListener(_type: string, _listener: any): void {}
  removeEventListener(_type: string, _listener: any): void {}
  dispatchEvent(_event: any): boolean { return true; }
}
