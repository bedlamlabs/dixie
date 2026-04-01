/**
 * Page collector — composes existing collectors into a single structured
 * JSON output representing everything an agent needs from a page.
 *
 * This is the default output for `dixie <url>`.
 */

import { collectText } from './text';
import { collectLinks } from './links';
import { collectForms } from './forms';
import { collectStructure } from './structure';
import type { FormField } from './forms';
import type { StructureResult } from './structure';

// ── Types ─────────────────────────────────────────────────────────────

export interface PageContent {
  url: string;
  title: string;
  meta: {
    description?: string;
    openGraph: Record<string, string>;
    jsonLd: unknown[];
  };
  headings: Array<{ level: number; text: string }>;
  text: string;
  links: Array<{ href?: string; text: string }>;
  buttons: Array<{ text: string; type: string }>;
  forms: { fields: FormField[] };
  images: Array<{ src: string; alt?: string }>;
  structure: StructureResult;
  errors: Array<{ code: string; message: string }>;
  _meta: {
    renderMs: number;
    parseMs: number;
    scriptsExecuted?: number;
    scriptsFailed?: number;
  };
}

// ── Collector ─────────────────────────────────────────────────────────

export function collectPage(
  doc: any,
  meta: { url: string; renderMs: number; parseMs: number },
  errors: Array<{ code: string; message: string }>,
): PageContent {
  const { text } = collectText(doc);
  const { links, buttons } = collectLinks(doc);
  const { fields } = collectForms(doc);
  const structure = collectStructure(doc);

  return {
    url: meta.url,
    title: doc.title ?? '',
    meta: extractMeta(doc),
    headings: extractHeadings(doc),
    text,
    links,
    buttons,
    forms: { fields },
    images: extractImages(doc),
    structure,
    errors,
    _meta: {
      renderMs: meta.renderMs,
      parseMs: meta.parseMs,
    },
  };
}

// ── Inline extractors (too small for separate collector files) ────────

function extractHeadings(doc: any): Array<{ level: number; text: string }> {
  const headings: Array<{ level: number; text: string }> = [];
  const els = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  for (const el of els) {
    const level = parseInt(el.tagName[1], 10);
    const text = (el.textContent ?? '').trim();
    if (text) headings.push({ level, text });
  }
  return headings;
}

function extractImages(doc: any): Array<{ src: string; alt?: string }> {
  const images: Array<{ src: string; alt?: string }> = [];
  const els = doc.querySelectorAll('img');
  for (const el of els) {
    const src = el.getAttribute('src');
    if (!src) continue;
    const alt = el.getAttribute('alt') ?? undefined;
    images.push({ src, ...(alt !== undefined ? { alt } : {}) });
  }
  return images;
}

function extractMeta(doc: any): PageContent['meta'] {
  const openGraph: Record<string, string> = {};
  const jsonLd: unknown[] = [];
  let description: string | undefined;

  // Meta tags
  const metas = doc.querySelectorAll('meta');
  for (const el of metas) {
    const name = (el.getAttribute('name') ?? '').toLowerCase();
    const property = (el.getAttribute('property') ?? '').toLowerCase();
    const content = el.getAttribute('content') ?? '';

    if (name === 'description') {
      description = content;
    } else if (property.startsWith('og:')) {
      openGraph[property] = content;
    } else if (property.startsWith('twitter:') || name.startsWith('twitter:')) {
      openGraph[property || name] = content;
    }
  }

  // JSON-LD
  const ldScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const el of ldScripts) {
    const text = (el.textContent ?? '').trim();
    if (text) {
      try {
        jsonLd.push(JSON.parse(text));
      } catch {
        // Malformed JSON-LD — skip silently
      }
    }
  }

  return {
    ...(description ? { description } : {}),
    openGraph,
    jsonLd,
  };
}
