import type { ParsedArgs, CommandResult } from '../types';
import { renderUrl } from './render';
import { formatOutput } from '../format';
import { click } from '../../interaction/click';
import { parseHTML } from '../../index';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import yaml from 'js-yaml';
const parseYaml = yaml.load;

export interface MetadataEntry {
  category: string;
  key: string;
  value: string | null;
  displayText: string;
  tagName: string;
  testId: string | null;
}

interface ContractEntry {
  label: string;
  locations: Array<{ container: string; components: string[] }>;
}

interface MetadataContract {
  containers: {
    pages: Record<string, { route: string; slideouts?: string[] }>;
    slideouts: Record<string, { component: string; parent: string }>;
  };
  categories: Record<string, Record<string, ContractEntry>>;
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
 * Load the metadata contract from the config-specified path.
 */
function loadContract(configPath?: string): MetadataContract | null {
  const contractPath = configPath || './docs/metadata-contract.yaml';
  try {
    const raw = readFileSync(resolve(process.cwd(), contractPath), 'utf-8');
    return parseYaml(raw) as MetadataContract;
  } catch {
    return null;
  }
}

/**
 * Find which container a URL matches in the contract.
 */
function matchRoute(url: string, contract: MetadataContract): { name: string; type: 'page' | 'slideout' } | null {
  const urlPath = new URL(url).pathname;
  for (const [name, page] of Object.entries(contract.containers.pages)) {
    const pattern = page.route.replace(/:[\w]+/g, '[^/]+');
    if (new RegExp(`^${pattern}$`).test(urlPath)) {
      return { name, type: 'page' };
    }
  }
  return null;
}

/**
 * Get all expected metadata keys for a given container from the contract.
 */
function getExpectedKeys(containerName: string, contract: MetadataContract): Array<{ category: string; key: string; label: string }> {
  const expected: Array<{ category: string; key: string; label: string }> = [];
  for (const [catName, entries] of Object.entries(contract.categories)) {
    for (const [keyName, entry] of Object.entries(entries)) {
      for (const loc of entry.locations) {
        if (loc.container === containerName) {
          expected.push({ category: catName, key: keyName, label: entry.label });
        }
      }
    }
  }
  return expected;
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
 *
 * Modes:
 *   dixie meta <url>                    — all metadata as JSON
 *   dixie meta <url> --type status      — filter by category
 *   dixie meta <url> --text e-sign      — freeform substring search on key
 *   dixie meta <url> --key status:e-sign — contract-validated lookup (exact key)
 *   dixie meta <url> --validate          — check all expected keys for this route
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

    // ── --key mode: contract-validated exact lookup ──────────────────
    if (args.key) {
      const contract = loadContract();
      const parsed = parseMeta(args.key);

      if (!parsed) {
        return {
          exitCode: 1,
          data: { command: 'meta', error: `Invalid key format: "${args.key}". Expected "category:key" (e.g., "status:e-sign")` },
          errors: [{ code: 'INVALID_KEY', message: `Invalid key format: "${args.key}"` }],
        };
      }

      // Validate key exists in contract
      let contractEntry: ContractEntry | null = null;
      if (contract) {
        const catEntries = contract.categories[parsed.category];
        if (catEntries && catEntries[parsed.key]) {
          contractEntry = catEntries[parsed.key];
        } else {
          return {
            exitCode: 1,
            data: {
              command: 'meta',
              error: `Key "${args.key}" not found in metadata contract. Check docs/metadata-contract.yaml for valid keys.`,
              available_keys: contract.categories[parsed.category]
                ? Object.keys(contract.categories[parsed.category])
                : [],
              available_categories: Object.keys(contract.categories),
            },
            errors: [{ code: 'KEY_NOT_IN_CONTRACT', message: `"${args.key}" not in contract` }],
          };
        }
      }

      // Query DOM for the exact key
      const selector = `[data-meta="${args.key}"]`;
      const elements = Array.from(doc.querySelectorAll(selector)) as any[];
      const metadata = elements.map((el: any) => ({
        category: parsed.category,
        key: parsed.key,
        value: el.getAttribute('data-meta-value') ?? null,
        displayText: (el.textContent ?? '').trim(),
        tagName: el.tagName?.toLowerCase() ?? 'unknown',
        testId: el.getAttribute('data-testid') ?? null,
      }));

      const found = metadata.length > 0;
      const metaData: any = {
        command: 'meta',
        status: found ? 'found' : 'not-found',
        url: args.url,
        key: args.key,
        label: contractEntry?.label ?? null,
        expectedLocations: contractEntry?.locations ?? null,
        count: metadata.length,
        metadata,
      };

      return {
        exitCode: found ? 0 : 1,
        output: formatOutput(metaData, args.format ?? 'json'),
        data: metaData,
      };
    }

    // ── --validate mode: check all expected keys for this route ──────
    if (args.validate) {
      const contract = loadContract();
      if (!contract) {
        return {
          exitCode: 1,
          data: { command: 'meta', error: 'Cannot load metadata contract. Check metadata.contract path in .dixie config.' },
          errors: [{ code: 'NO_CONTRACT', message: 'metadata contract not found' }],
        };
      }

      const matched = matchRoute(args.url, contract);
      if (!matched) {
        return {
          exitCode: 1,
          data: { command: 'meta', error: `No contract route matches "${args.url}"` },
          errors: [{ code: 'NO_ROUTE_MATCH', message: `URL doesn't match any contract route` }],
        };
      }

      const expected = getExpectedKeys(matched.name, contract);
      const allMetadata = collectMetadataFromDoc(doc);

      const results = expected.map(exp => {
        const foundItems = allMetadata.filter(m => m.category === exp.category && m.key === exp.key);
        return {
          key: `${exp.category}:${exp.key}`,
          label: exp.label,
          expected: true,
          found: foundItems.length > 0,
          count: foundItems.length,
          displayText: foundItems[0]?.displayText ?? null,
          value: foundItems[0]?.value ?? null,
        };
      });

      const missing = results.filter(r => !r.found);
      const present = results.filter(r => r.found);

      const metaData = {
        command: 'meta',
        mode: 'validate',
        status: missing.length === 0 ? 'pass' : 'fail',
        url: args.url,
        route: matched.name,
        expected: results.length,
        found: present.length,
        missing: missing.length,
        results,
      };

      return {
        exitCode: missing.length === 0 ? 0 : 1,
        output: formatOutput(metaData, args.format ?? 'json'),
        data: metaData,
      };
    }

    // ── Default mode: collect all metadata ───────────────────────────
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
