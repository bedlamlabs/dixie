export const SENSITIVE_HEADERS = /^(authorization|cookie|set-cookie)$/i;
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

export function redactSnapshot<T extends Record<string, any>>(snapshot: T): T {
  if (!snapshot.api) return snapshot;
  return {
    ...snapshot,
    api: snapshot.api.map((entry: any) => {
      if (!entry?.requestBody?.headers) return entry;
      return {
        ...entry,
        requestBody: {
          ...entry.requestBody,
          headers: redactHeaders(entry.requestBody.headers),
        },
      };
    }),
  };
}
