import type { ParsedArgs, CommandResult } from '../types';
import { MockFetch } from '../../fetch/MockFetch';
import { renderUrl } from './render';

export async function execute(args: ParsedArgs): Promise<CommandResult> {
  if (!args.url) {
    return {
      exitCode: 1,
      errors: [{ code: 'MISSING_URL', message: 'mock-replay requires a URL' }],
    };
  }

  try {
    // Support _harData injection for unit testing (no file I/O)
    let harEntries = (args as any)._harData;

    if (!harEntries && args.harFile) {
      const fs = await import('node:fs');
      const raw = fs.readFileSync(args.harFile, 'utf-8');
      const parsed = JSON.parse(raw);
      harEntries = parsed.entries ?? parsed;
    }

    if (!harEntries) {
      harEntries = [];
    }

    // Load HAR entries into MockFetch
    const mockFetch = MockFetch.loadFromHar(harEntries);

    // Render with timing
    const start = performance.now();
    const result = await renderUrl(args.url, {
      token: args.token,
      timeout: args.timeout,
      noJs: args.noJs,
    });
    const renderMs = Math.round((performance.now() - start) * 100) / 100;

    return {
      exitCode: 0,
      data: {
        url: args.url,
        renderMs,
        elementCount: result.document.querySelectorAll('*').length,
        replayedAt: new Date().toISOString(),
      },
    };
  } catch (err: any) {
    return {
      exitCode: 1,
      errors: [{ code: err.code ?? 'REPLAY_ERROR', message: err.message }],
    };
  }
}
