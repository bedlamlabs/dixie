import type { ParsedArgs, CommandResult } from '../types';
import { renderUrl } from './render';
import { HarRecorder } from '../../har/recorder';
import { exportHar } from '../../har/exporter';
import { formatOutput } from '../format';

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
      harRecorder: recorder,
    });

    const har = exportHar(recorder);
    const data = { command: 'har', status: 'ok', ...har };
    const output = formatOutput(data, args.format ?? 'json');
    return { exitCode: 0, output, data };
  } catch (err: any) {
    return {
      exitCode: 1,
      data: { command: 'har', error: err.message },
      errors: [{ code: 'HAR_ERROR', message: err.message }],
    };
  }
}
