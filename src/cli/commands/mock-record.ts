import type { ParsedArgs, CommandResult } from '../types';
import { renderUrl } from './render';

export async function execute(args: ParsedArgs): Promise<CommandResult> {
  if (!args.url) {
    return {
      exitCode: 1,
      errors: [{ code: 'MISSING_URL', message: 'mock-record requires a URL' }],
    };
  }

  try {
    const { HarRecorder } = await import('../../har/recorder');
    const recorder = new HarRecorder();

    // Render the URL — for data: URLs no fetch calls will be recorded
    const result = await renderUrl(args.url, {
      token: args.token,
      timeout: args.timeout,
      noJs: args.noJs,
    });

    const entries = recorder.getEntries();

    return {
      exitCode: 0,
      data: {
        url: args.url,
        entries,
        recordedAt: new Date().toISOString(),
      },
    };
  } catch (err: any) {
    return {
      exitCode: 1,
      errors: [{ code: err.code ?? 'RECORD_ERROR', message: err.message }],
    };
  }
}
