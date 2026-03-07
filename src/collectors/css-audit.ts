export interface CssAuditFlag {
  type: 'hidden-element' | 'empty-trigger' | 'off-screen' | 'zero-size';
  element?: string;
  detail?: string;
}

export interface CssAuditResult {
  flags: CssAuditFlag[];
}

function hasVisibleText(el: any): boolean {
  const text = (el.textContent ?? '').trim();
  return text.length > 0;
}

export function collectCssAudit(doc: any): CssAuditResult {
  const flags: CssAuditFlag[] = [];

  // Inline style: display:none
  const styled = doc.querySelectorAll('[style]');
  for (const el of styled) {
    const style = (el.getAttribute('style') ?? '').toLowerCase().replace(/\s+/g, '');
    if (style.includes('display:none')) {
      flags.push({ type: 'hidden-element', element: el.tagName.toLowerCase() });
    }
  }

  // Empty triggers: buttons, links with no visible text
  const triggers = doc.querySelectorAll('button, a[href]');
  for (const el of triggers) {
    if (!hasVisibleText(el)) {
      flags.push({
        type: 'empty-trigger',
        element: el.tagName.toLowerCase(),
      });
    }
  }

  return { flags };
}
