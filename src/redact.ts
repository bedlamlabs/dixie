export const SENSITIVE_HEADERS = /^(authorization|cookie|set-cookie)$/i;
// BEARER_PATTERN tests header *values*, not header names.
// Any header whose value starts with "Bearer " is redacted, regardless of the
// header name. This catches auth tokens placed in non-standard headers
// (e.g. X-Api-Key: Bearer abc123). Expected — not a bug.
const BEARER_PATTERN = /^bearer\s+/i;

export function redactHeaders(headers: Record<string, string> | undefined): Record<string, string> | undefined {
  if (!headers || typeof headers !== 'object') return headers;
  const result = { ...headers };
  for (const key of Object.keys(result)) {
    if (SENSITIVE_HEADERS.test(key) || BEARER_PATTERN.test(result[key] ?? '')) {
      result[key] = '[REDACTED]';
    }
  }
  return result;
}

const SENSITIVE_BODY_FIELDS = /^(token|secret|password|apiKey|api_key|authorization|access_token|refresh_token)$/i;
const SENSITIVE_QUERY_PARAMS = /^(token|secret|key|password|authorization|access_token|api_key)$/i;

function redactBody(body: any, depth = 0): any {
  if (depth > 5 || body === null || body === undefined) return body;
  if (typeof body !== 'object') return body;
  if (Array.isArray(body)) return body.map(item => redactBody(item, depth + 1));
  const result = { ...body };
  for (const key of Object.keys(result)) {
    if (SENSITIVE_BODY_FIELDS.test(key)) {
      result[key] = '[REDACTED]';
    } else if (typeof result[key] === 'object' && result[key] !== null) {
      result[key] = redactBody(result[key], depth + 1);
    }
  }
  return result;
}

function redactUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const params = new URLSearchParams(parsed.search);
    let changed = false;
    for (const [key] of params.entries()) {
      if (SENSITIVE_QUERY_PARAMS.test(key)) {
        params.set(key, '[REDACTED]');
        changed = true;
      }
    }
    if (changed) {
      parsed.search = params.toString();
      return parsed.toString();
    }
    return url;
  } catch {
    return url;
  }
}

export function redactSnapshot<T extends Record<string, any>>(snapshot: T): T {
  if (!snapshot.api) return snapshot;
  return {
    ...snapshot,
    api: snapshot.api.map((entry: any) => {
      const redacted = { ...entry };

      // Redact URL query params
      if (redacted.url) {
        redacted.url = redactUrl(redacted.url);
      }

      // Redact request headers
      if (redacted.requestBody?.headers) {
        redacted.requestBody = {
          ...redacted.requestBody,
          headers: redactHeaders(redacted.requestBody.headers),
        };
      }

      // Redact request body fields
      if (redacted.requestBody?.body) {
        redacted.requestBody = {
          ...redacted.requestBody,
          body: redactBody(redacted.requestBody.body),
        };
      }

      // Redact response headers
      if (redacted.responseHeaders) {
        redacted.responseHeaders = redactHeaders(redacted.responseHeaders);
      }

      return redacted;
    }),
  };
}
