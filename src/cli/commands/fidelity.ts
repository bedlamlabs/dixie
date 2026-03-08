import type { ParsedArgs, CommandResult } from '../types';
import { DiffSnapshot } from '../../assertions';
import { renderUrl } from './render';
import { createVmContext } from '../../execution/vm-context';

async function getDocument(url: string, args: ParsedArgs): Promise<any> {
  try {
    const result = await renderUrl(url, {
      token: args.token,
      timeout: args.timeout,
      noJs: args.noJs,
    });
    return result.document;
  } catch {
    const ctx = createVmContext({ timeout: 5000, url });
    return ctx.document;
  }
}

export async function execute(args: ParsedArgs): Promise<CommandResult> {
  if (!args.url) {
    return {
      exitCode: 1,
      data: { command: 'fidelity', error: 'fidelity requires a URL' },
      errors: [{ code: 'MISSING_URL', message: 'fidelity requires a URL' }],
    };
  }

  try {
    const doc = await getDocument(args.url, args);

    // Capture a snapshot of the rendered page
    const snapshot = DiffSnapshot.capture(doc);

    // If a second URL or snapshot path is provided, compare them
    const rest = args.rest ?? [];
    const compareUrl = args.selector ?? rest[0];
    if (compareUrl) {
      const doc2 = await getDocument(compareUrl, args);
      const snapshot2 = DiffSnapshot.capture(doc2);
      const diff = DiffSnapshot.diff(snapshot, snapshot2);

      return {
        exitCode: 0,
        data: {
          command: 'fidelity',
          status: 'ok',
          match: diff.identical,
          summary: diff.summary,
          stats: diff.stats,
          entries: diff.entries,
        },
      };
    }

    // Single URL: return snapshot data
    return {
      exitCode: 0,
      data: {
        command: 'fidelity',
        status: 'ok',
        match: true,
        snapshot,
      },
    };
  } catch (err: any) {
    return {
      exitCode: 1,
      data: { command: 'fidelity', error: err.message },
      errors: [{ code: 'FIDELITY_ERROR', message: err.message }],
    };
  }
}
