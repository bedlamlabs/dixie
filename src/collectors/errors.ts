export interface ErrorsResult {
  errorBoundaries: Array<{ text: string; element: string }>;
}

const ERROR_PATTERNS = [
  /something went wrong/i,
  /error boundary/i,
  /unexpected error/i,
  /an error occurred/i,
  /application error/i,
];

export function collectErrors(doc: any): ErrorsResult {
  const errorBoundaries: Array<{ text: string; element: string }> = [];

  // Check role="alert"
  const alerts = doc.querySelectorAll('[role="alert"]');
  for (const alert of alerts) {
    const text = (alert.textContent ?? '').trim();
    if (text) {
      errorBoundaries.push({ text, element: alert.tagName.toLowerCase() });
    }
  }

  // Check for common error boundary text patterns in body
  const body = doc.body;
  if (body) {
    const bodyText = (body.textContent ?? '').trim();
    for (const pattern of ERROR_PATTERNS) {
      if (pattern.test(bodyText)) {
        // Find the element containing the error text
        const allElements = doc.querySelectorAll('*');
        for (const el of allElements) {
          const elText = (el.textContent ?? '').trim();
          if (pattern.test(elText) && el.children.length === 0) {
            // Only add if not already found via role="alert"
            const alreadyFound = errorBoundaries.some(e => e.text === elText);
            if (!alreadyFound) {
              errorBoundaries.push({ text: elText, element: el.tagName.toLowerCase() });
            }
            break;
          }
        }
        break;
      }
    }
  }

  return { errorBoundaries };
}
