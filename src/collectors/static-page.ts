/**
 * Static-page collector — generic single-walk extraction of the element
 * classes a static crawler cares about: anchors, button-like elements,
 * headings, inline scripts, and visible text length.
 *
 * Shapes intentionally mirror what a cheerio-based extractor produces:
 *   links:    a[href]                    → { href, text, rel? }
 *   buttons:  button/[role]/[data-*]     → { href, text }
 *   headings: h1-h4                      → { text, level }
 *   scripts:  inline script text, collapsed, non-empty, capped at 80
 *   textLength: collapsed document text with script/style/noscript/svg
 *               subtrees excluded (the document is never mutated)
 *
 * Everything is gathered in ONE tree walk.
 */

import { parseSelector, matchesSelector } from '../selectors';
import type { SelectorList } from '../selectors';

export interface StaticPageLink {
  href: string;
  text: string;
  rel?: string;
}

export interface StaticPageButton {
  href: string;
  text: string;
}

export interface StaticPageHeading {
  text: string;
  level: number;
}

export interface StaticPageResult {
  links: StaticPageLink[];
  buttons: StaticPageButton[];
  headings: StaticPageHeading[];
  scripts: string[];
  textLength: number;
}

export interface CollectStaticPageOptions {
  /** CSS selector; headings with a matching ancestor (or self) are excluded. */
  contextFilter?: string;
}

export interface CollectRepeatedGroupsOptions {
  /** Selectors to scan, in order. Each selector produces its own groups. */
  selectors: string[];
  /** CSS selector; elements with a matching ancestor (or self) are excluded. */
  excludeContext?: string;
  /** Max candidates kept per selector (applied after filter/exclusion). */
  cap?: number;
  /** Optional generic predicate applied before exclusion and cap. */
  filter?: (el: any) => boolean;
}

const SCRIPT_CAP = 80;

/** Tags whose subtree text is excluded from textLength. */
const TEXT_SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG']);

const HEADING_LEVELS: Record<string, number> = { H1: 1, H2: 2, H3: 3, H4: 4 };

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

function collapse(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/** closest() against a pre-parsed selector list — includes the element itself. */
function closestMatch(el: any, ast: SelectorList): boolean {
  let current: any = el;
  while (current && current.nodeType === ELEMENT_NODE) {
    if (matchesSelector(current, ast)) return true;
    current = current.parentNode;
  }
  return false;
}

export function collectStaticPage(doc: any, options: CollectStaticPageOptions = {}): StaticPageResult {
  const contextAst = options.contextFilter ? parseSelector(options.contextFilter) : null;

  const links: StaticPageLink[] = [];
  const buttons: StaticPageButton[] = [];
  const headings: StaticPageHeading[] = [];
  const scripts: string[] = [];
  const textParts: string[] = [];

  // Single walk. `textExcluded` marks subtrees whose text nodes do not count
  // toward textLength (element collection still proceeds inside them, which
  // matches querying an unmutated document).
  const walk = (node: any, textExcluded: boolean): void => {
    const nodeType = node.nodeType;

    if (nodeType === TEXT_NODE) {
      if (!textExcluded) textParts.push(node.data ?? node.textContent ?? '');
      return;
    }

    let childExcluded = textExcluded;

    if (nodeType === ELEMENT_NODE) {
      const tag = node.tagName;

      if (tag === 'A') {
        if (node.getAttribute('href') !== null) {
          const link: StaticPageLink = {
            href: node.getAttribute('href') || '',
            text: collapse(node.textContent || ''),
          };
          const rel = collapse(node.getAttribute('rel') || '');
          if (rel) link.rel = rel;
          links.push(link);
        }
      } else if (tag === 'SCRIPT') {
        if (scripts.length < SCRIPT_CAP) {
          const content = collapse(node.textContent || '');
          if (content) scripts.push(content);
        }
      } else {
        const level = HEADING_LEVELS[tag];
        if (level) {
          if (!contextAst || !closestMatch(node, contextAst)) {
            headings.push({ text: collapse(node.textContent || ''), level });
          }
        }
      }

      // Button-like: button tag, role=button/link, or data-url/data-href.
      if (
        tag === 'BUTTON'
        || node.getAttribute('role') === 'button'
        || node.getAttribute('role') === 'link'
        || node.getAttribute('data-url') !== null
        || node.getAttribute('data-href') !== null
      ) {
        buttons.push({
          href: node.getAttribute('href') || node.getAttribute('data-url') || node.getAttribute('data-href') || '',
          text: collapse(node.textContent || node.getAttribute('aria-label') || node.getAttribute('title') || ''),
        });
      }

      if (!childExcluded && TEXT_SKIP_TAGS.has(tag)) childExcluded = true;
    }

    const children = node.childNodes;
    if (children) {
      for (let i = 0, len = children.length; i < len; i++) {
        walk(children[i], childExcluded);
      }
    }
  };

  walk(doc, false);

  return {
    links,
    buttons,
    headings,
    scripts,
    // Concatenate raw text-node data first, then collapse — matches
    // "collapse(document.text())" semantics across node boundaries.
    textLength: collapse(textParts.join('')).length,
  };
}

/**
 * collectRepeatedGroups — generic repeated-sibling structure detector.
 * For each selector: match elements, drop ones failing `filter` or sitting
 * inside `excludeContext`, cap the survivors, group them by parent element,
 * and keep only groups with >= 2 siblings. Returns arrays of Elements.
 */
export function collectRepeatedGroups(doc: any, options: CollectRepeatedGroupsOptions): any[][] {
  const { selectors, excludeContext, cap = 200, filter } = options;
  const excludeAst = excludeContext ? parseSelector(excludeContext) : null;
  const results: any[][] = [];

  for (const selector of selectors) {
    const matched = doc.querySelectorAll(selector);
    const kept: any[] = [];
    for (const el of matched) {
      if (filter && !filter(el)) continue;
      if (excludeAst && closestMatch(el, excludeAst)) continue;
      kept.push(el);
      if (kept.length >= cap) break;
    }
    if (kept.length < 2) continue;

    const groups = new Map<any, any[]>();
    for (const el of kept) {
      const key = el.parentNode || doc;
      const group = groups.get(key);
      if (group) group.push(el);
      else groups.set(key, [el]);
    }
    for (const group of groups.values()) {
      if (group.length >= 2) results.push(group);
    }
  }

  return results;
}
