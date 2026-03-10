import type { ParsedArgs, CommandResult } from '../types';
import { renderUrl } from './render';
import { formatOutput } from '../format';

export async function execute(args: ParsedArgs): Promise<CommandResult> {
  if (!args.url) {
    return {
      exitCode: 1,
      data: { command: 'mock-record', error: 'mock-record requires a URL' },
      errors: [{ code: 'MISSING_URL', message: 'mock-record requires a URL' }],
    };
  }

  try {
    const { HarRecorder } = await import('../../har/recorder');
    const recorder = new HarRecorder();

    // Render the URL — pass recorder so fetch interceptor in render.ts populates it
    const result = await renderUrl(args.url, {
      token: args.token,
      timeout: args.timeout,
      noJs: args.noJs,
      harRecorder: recorder,
    });

    const entries = recorder.getEntries();
    const data = { url: args.url, entries, recordedAt: new Date().toISOString() };
    const output = formatOutput(data, args.format ?? 'json');

    return {
      exitCode: 0,
      output,
      data,
    };
  } catch (err: any) {
    return {
      exitCode: 1,
      data: { command: 'mock-record', error: err.message },
      errors: [{ code: err.code ?? 'RECORD_ERROR', message: err.message }],
    };
  }
}
