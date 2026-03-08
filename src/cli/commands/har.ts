import type { ParsedArgs, CommandResult } from '../types';
import { renderUrl } from './render';
import { HarRecorder } from '../../har/recorder';
import { exportHar } from '../../har/exporter';

export async function execute(args: ParsedArgs): Promise<CommandResult> {
  if (!args.url) {
    return {
      exitCode: 1,
      data: { command: 'har', error: 'har requires a URL' },
      errors: [{ code: 'MISSING_URL', message: 'har requires a URL' }],
    };
  }

  try {
    const recorder = new HarRecorder();

    await renderUrl(args.url, {
      token: args.token,
      timeout: args.timeout,
      noJs: args.noJs,
    });

    const har = exportHar(recorder);
    return {
      exitCode: 0,
      data: { command: 'har', status: 'ok', ...har },
    };
  } catch (err: any) {
    return {
      exitCode: 1,
      data: { command: 'har', error: err.message },
      errors: [{ code: 'HAR_ERROR', message: err.message }],
    };
  }
}
