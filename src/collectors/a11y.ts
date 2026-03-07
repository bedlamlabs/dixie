export interface A11yIssue {
  type: 'missing-alt' | 'missing-label' | 'heading-skip';
  element?: string;
  detail?: string;
}

export interface A11yResult {
  issues: A11yIssue[];
}

export function collectA11y(doc: any): A11yResult {
  const issues: A11yIssue[] = [];

  // Images without alt
  const imgs = doc.querySelectorAll('img');
  for (const img of imgs) {
    const alt = img.getAttribute('alt');
    if (alt === null || alt === undefined) {
      issues.push({
        type: 'missing-alt',
        element: img.getAttribute('src') ?? 'img',
      });
    }
  }

  // Inputs without labels
  const inputs = doc.querySelectorAll('input');
  for (const input of inputs) {
    const id = input.getAttribute('id');
    const hasLabel = id && doc.querySelector(`label[for="${id}"]`);
    const hasAriaLabel = input.getAttribute('aria-label');
    const parentLabel = input.closest?.('label');
    if (!hasLabel && !hasAriaLabel && !parentLabel) {
      issues.push({
        type: 'missing-label',
        element: `input[type="${input.getAttribute('type') ?? 'text'}"]`,
      });
    }
  }

  // Heading hierarchy and skips
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let lastLevel = 0;
  for (const h of headings) {
    const level = parseInt(h.tagName[1], 10);
    if (lastLevel > 0 && level > lastLevel + 1) {
      issues.push({
        type: 'heading-skip',
        detail: `Missing H${lastLevel + 1} between H${lastLevel} and H${level}`,
      });
    }
    lastLevel = level;
  }

  return { issues };
}
