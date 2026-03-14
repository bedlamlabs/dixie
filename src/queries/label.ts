export function getByLabel(doc: any, labelText: string): any {
  const matches = getAllByLabel(doc, labelText);
  if (matches.length === 0) {
    throw new Error(`Unable to find element with label "${labelText}" — no matches found`);
  }
  if (matches.length > 1) {
    throw new Error(`Found multiple elements with label "${labelText}" — use getAllByLabel instead`);
  }
  return matches[0];
}

export function getAllByLabel(doc: any, labelText: string): any[] {
  const results: any[] = [];

  // 1. Check aria-label
  const ariaLabeled = doc.querySelectorAll(`[aria-label="${labelText}"]`);
  for (const el of ariaLabeled) {
    results.push(el);
  }

  // 2. Check <label for="id"> association
  const labels = doc.querySelectorAll('label');
  for (const label of labels) {
    const text = (label.textContent ?? '').trim();
    if (text !== labelText.trim()) continue;

    const forAttr = label.getAttribute('for');
    if (forAttr) {
      const target = doc.getElementById(forAttr);
      if (target && !results.includes(target)) {
        results.push(target);
      }
    } else {
      // Wrapping label — find the input inside
      const input = label.querySelector('input, select, textarea');
      if (input && !results.includes(input)) {
        results.push(input);
      }
    }
  }

  return results;
}
