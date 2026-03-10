import type { ParsedArgs, CommandResult } from '../types';
import { renderUrl } from './render';
import { createHash } from 'node:crypto';
import { formatOutput } from '../format';

function buildDomSummary(document: any): { tagCounts: Record<string, number>; structureHash: string; textContent: string } {
  const tagCounts: Record<string, number> = {};
  const allElements = document.querySelectorAll('*');

  for (const el of allElements) {
    const tag = el.tagName;
    if (tag) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  }

  // Structure hash: deterministic hash of sorted tag names with counts
  const sortedTags = Object.keys(tagCounts).sort();
  const structureStr = sortedTags.map(t => `${t}:${tagCounts[t]}`).join(',');
  const structureHash = createHash('sha256').update(structureStr).digest('hex').slice(0, 12);

  // Text content summary
  const textContent = (document.body?.textContent ?? '').trim().slice(0, 500);

  return { tagCounts, structureHash, textContent };
}

function extractDataPayloads(harEntries: any[]): Record<string, any> {
  const data: Record<string, any> = {};
  for (const entry of harEntries) {
    const url = entry.request?.url ?? entry.url;
    const responseText = entry.response?.content?.text ?? entry.responseBody;
    if (url && responseText) {
      try {
        data[url] = JSON.parse(responseText);
      } catch {
        // Not JSON — skip
      }
    }
  }
  return data;
}

export async function execute(args: ParsedArgs): Promise<CommandResult> {
  if (!args.url) {
    return {
      exitCode: 1,
      data: { command: 'snapshot', error: 'snapshot requires a URL' },
      errors: [{ code: 'MISSING_URL', message: 'snapshot requires a URL' }],
    };
  }

  try {
    const result = await renderUrl(args.url, {
      token: args.token,
      timeout: args.timeout,
      noJs: args.noJs,
    });

    const dom = buildDomSummary(result.document);

    // For data: URLs there are no network entries
    const network: any[] = [];
    const data = extractDataPayloads(network);

    const snapshot = {
      meta: {
        url: args.url,
        timestamp: new Date().toISOString(),
        ...(result.meta.auth ? { auth: result.meta.auth } : {}),
      },
      dom,
      network,
      data,
    };

    const output = formatOutput(snapshot, args.format ?? 'json');
    return {
      exitCode: 0,
      output,
      data: snapshot,
      errors: result.errors.length > 0 ? result.errors : undefined,
    };
  } catch (err: any) {
    return {
      exitCode: 1,
      data: { command: 'snapshot', error: err.message },
      errors: [{ code: err.code ?? 'SNAPSHOT_ERROR', message: err.message }],
    };
  }
}
