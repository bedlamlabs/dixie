// Implicit ARIA role mapping
const IMPLICIT_ROLES: Record<string, string | ((el: any) => string | null)> = {
  'A': (el) => el.getAttribute('href') ? 'link' : null,
  'BUTTON': 'button',
  'INPUT': (el) => {
    const type = (el.getAttribute('type') ?? 'text').toLowerCase();
    switch (type) {
      case 'checkbox': return 'checkbox';
      case 'radio': return 'radio';
      case 'range': return 'slider';
      case 'search': return 'searchbox';
      default: return 'textbox';
    }
  },
  'SELECT': 'combobox',
  'TEXTAREA': 'textbox',
  'IMG': 'img',
  'TABLE': 'table',
  'FORM': 'form',
  'NAV': 'navigation',
  'MAIN': 'main',
  'HEADER': 'banner',
  'FOOTER': 'contentinfo',
  'ASIDE': 'complementary',
  'UL': 'list',
  'OL': 'list',
  'LI': 'listitem',
  'H1': 'heading',
  'H2': 'heading',
  'H3': 'heading',
  'H4': 'heading',
  'H5': 'heading',
  'H6': 'heading',
};

function getRole(el: any): string | null {
  // Explicit role attribute takes precedence
  const explicit = el.getAttribute('role');
  if (explicit) return explicit;

  // Implicit role from element type
  const mapping = IMPLICIT_ROLES[el.tagName];
  if (!mapping) return null;
  if (typeof mapping === 'function') return mapping(el);
  return mapping;
}

function getHeadingLevel(el: any): number | null {
  const match = el.tagName.match(/^H(\d)$/);
  return match ? parseInt(match[1], 10) : null;
}

function getAccessibleName(el: any): string {
  // aria-label
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;

  // Text content
  return (el.textContent ?? '').trim();
}

export interface RoleOptions {
  level?: number;
  name?: string;
}

export function getByRole(doc: any, role: string, options?: RoleOptions): any {
  const matches = getAllByRole(doc, role, options);
  if (matches.length === 0) {
    throw new Error(`Unable to find element with role="${role}" — no matches found`);
  }
  if (matches.length > 1) {
    throw new Error(`Found multiple elements with role="${role}" — use getAllByRole instead`);
  }
  return matches[0];
}

export function getAllByRole(doc: any, role: string, options?: RoleOptions): any[] {
  const all = doc.querySelectorAll('*');
  const matches: any[] = [];

  for (const el of all) {
    const elRole = getRole(el);
    if (elRole !== role) continue;

    // Level filter (for headings)
    if (options?.level !== undefined) {
      const level = getHeadingLevel(el);
      if (level !== options.level) continue;
    }

    // Name filter (accessible name)
    if (options?.name !== undefined) {
      const name = getAccessibleName(el);
      if (name !== options.name) continue;
    }

    matches.push(el);
  }

  return matches;
}
