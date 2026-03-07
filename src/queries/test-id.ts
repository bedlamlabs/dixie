export function getByTestId(doc: any, testId: string): any {
  const elements = doc.querySelectorAll(`[data-testid="${testId}"]`);
  if (elements.length === 0) {
    throw new Error(`Unable to find element with data-testid="${testId}" — no matches found`);
  }
  if (elements.length > 1) {
    throw new Error(`Found multiple elements with data-testid="${testId}" — use getAllByTestId instead`);
  }
  return elements[0];
}

export function getAllByTestId(doc: any, testId: string): any[] {
  return Array.from(doc.querySelectorAll(`[data-testid="${testId}"]`));
}
