export interface HarRecordInput {
  method: string;
  url: string;
  status: number;
  responseBody: string;
  durationMs: number;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
}

export interface HarEntry {
  startedDateTime: string;
  time: number;
  request: {
    method: string;
    url: string;
    httpVersion: string;
    headers: Array<{ name: string; value: string }>;
    queryString: Array<{ name: string; value: string }>;
    headersSize: number;
    bodySize: number;
  };
  response: {
    status: number;
    statusText: string;
    httpVersion: string;
    headers: Array<{ name: string; value: string }>;
    content: {
      size: number;
      mimeType: string;
      text: string;
    };
    headersSize: number;
    bodySize: number;
  };
  cache: Record<string, never>;
  timings: {
    send: number;
    wait: number;
    receive: number;
  };
}

function headersToList(headers?: Record<string, string>): Array<{ name: string; value: string }> {
  if (!headers) return [];
  return Object.entries(headers).map(([name, value]) => ({ name, value }));
}

function parseQueryString(url: string): Array<{ name: string; value: string }> {
  try {
    const parsed = new URL(url);
    const result: Array<{ name: string; value: string }> = [];
    parsed.searchParams.forEach((value, name) => {
      result.push({ name, value });
    });
    return result;
  } catch {
    return [];
  }
}

function statusText(status: number): string {
  const map: Record<number, string> = {
    200: 'OK', 201: 'Created', 204: 'No Content',
    301: 'Moved Permanently', 302: 'Found', 304: 'Not Modified',
    400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
    404: 'Not Found', 500: 'Internal Server Error',
  };
  return map[status] ?? '';
}

export class HarRecorder {
  private entries: HarEntry[] = [];

  record(input: HarRecordInput): void {
    const entry: HarEntry = {
      startedDateTime: new Date().toISOString(),
      time: input.durationMs,
      request: {
        method: input.method,
        url: input.url,
        httpVersion: 'HTTP/1.1',
        headers: headersToList(input.requestHeaders),
        queryString: parseQueryString(input.url),
        headersSize: -1,
        bodySize: 0,
      },
      response: {
        status: input.status,
        statusText: statusText(input.status),
        httpVersion: 'HTTP/1.1',
        headers: headersToList(input.responseHeaders),
        content: {
          size: input.responseBody.length,
          mimeType: input.responseHeaders?.['content-type'] ?? 'application/octet-stream',
          text: input.responseBody,
        },
        headersSize: -1,
        bodySize: input.responseBody.length,
      },
      cache: {},
      timings: {
        send: 0,
        wait: input.durationMs,
        receive: 0,
      },
    };
    this.entries.push(entry);
  }

  getEntries(): HarEntry[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries = [];
  }
}
