import type { ParsedArgs, CommandResult } from '../types';
import { renderUrl } from './render';
import { formatOutput } from '../format';
import { click } from '../../interaction/click';
import { parseHTML } from '../../index';

export interface MetadataEntry {
  category: string;
  key: string;
  value: string | null;
  displayText: string;
  tagName: string;
  testId: string | null;
}

/**
 * Parse a data-meta attribute value into category and key.
 * Format: "category:key" — splits on the first colon.
 * Returns null for empty strings or strings without a colon.
 */
export function parseMeta(attrValue: string): { category: string; key: string } | null {
  if (!attrValue) return null;
  const colonIdx = attrValue.indexOf(':');
  if (colonIdx === -1) return null;
  const category = attrValue.slice(0, colonIdx);
  const key = attrValue.slice(colonIdx + 1);
  if (!category || !key) return null;
  return { category, key };
}

/**
 * Collect all data-meta elements from a live DOM document.
 * Used by the meta command after renderUrl().
 */
export function collectMetadataFromDoc(
  doc: any,
  opts?: { type?: string; text?: string },
): MetadataEntry[] {
  const elements = Array.from(doc.querySelectorAll('[data-meta]')) as any[];
  const results: MetadataEntry[] = [];

  for (const el of elements) {
    const attr = el.getAttribute('data-meta');
    const parsed = parseMeta(attr ?? '');
    if (!parsed) continue;

    const entry: MetadataEntry = {
      category: parsed.category,
      key: parsed.key,
      value: el.getAttribute('data-meta-value') ?? null,
      displayText: (el.textContent ?? '').trim(),
      tagName: el.tagName?.toLowerCase() ?? 'unknown',
      testId: el.getAttribute('data-testid') ?? null,
    };

    // Apply type filter
    if (opts?.type && entry.category !== opts.type.toLowerCase()) continue;

    // Apply text filter (case-insensitive substring match on key)
    if (opts?.text && !entry.key.toLowerCase().includes(opts.text.toLowerCase())) continue;

    results.push(entry);
  }

  return results;
}

/**
 * Collect metadata from an HTML string.
 * Thin wrapper for unit tests — parses HTML with Dixie's own parser,
 * then delegates to collectMetadataFromDoc.
 */
export function collectMetadata(
  html: string,
  opts?: { type?: string; text?: string },
): MetadataEntry[] {
  const doc = parseHTML(html);
  return collectMetadataFromDoc(doc, opts);
}

/**
 * meta command — extracts all data-meta annotated elements from a rendered page.
 */
export async function execute(args: ParsedArgs): Promise<CommandResult> {
  if (!args.url) {
    return {
      exitCode: 1,
      data: { command: 'meta', error: 'meta requires a URL' },
      errors: [{ code: 'MISSING_URL', message: 'meta requires a URL' }],
    };
  }

  try {
    const result = await renderUrl(args.url, {
      token: args.token,
      timeout: args.timeout,
      noJs: args.noJs,
      configPath: args.config,
    });

    const doc = result.document;

    // Click interaction: open slideouts/modals before collecting metadata
    if (args.click) {
      try {
        click(doc, args.click);
      } catch (clickErr: any) {
        return {
          exitCode: 1,
          data: { command: 'meta', error: clickErr.message },
          errors: [{ code: 'CLICK_ERROR', message: clickErr.message }],
        };
      }
      const suppress = () => {};
      process.on('uncaughtException', suppress);
      try {
        await result.flush({ timeoutMs: 5000, stableRounds: 3 });
      } finally {
        await new Promise<void>((r) => setTimeout(r, 200));
        process.removeListener('uncaughtException', suppress);
      }
    }

    const metadata = collectMetadataFromDoc(doc, {
      type: args.type,
      text: args.text,
    });

    const isTextSearch = args.text !== undefined;
    const status = isTextSearch
      ? (metadata.length > 0 ? 'found' : 'not-found')
      : 'ok';

    const metaData: any = {
      command: 'meta',
      status,
      url: args.url,
      count: metadata.length,
      metadata,
    };

    if (isTextSearch) {
      metaData.search = args.text;
    }

    if (args.type) {
      metaData.filter = { type: args.type };
    }

    return {
      exitCode: isTextSearch && metadata.length === 0 ? 1 : 0,
      output: formatOutput(metaData, args.format ?? 'json'),
      data: metaData,
    };
  } catch (err: any) {
    return {
      exitCode: 1,
      data: { command: 'meta', error: err.message },
      errors: [{ code: 'META_ERROR', message: err.message }],
    };
  }
}
