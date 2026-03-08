import type { ParsedArgs, CommandResult } from '../types';
import { renderUrl } from './render';
import { collectText } from '../../collectors/text';

export async function execute(args: ParsedArgs): Promise<CommandResult> {
  if (!args.url) {
    return {
      exitCode: 1,
      data: { command: 'text', error: 'text requires a URL' },
      errors: [{ code: 'MISSING_URL', message: 'text requires a URL' }],
    };
  }

  try {
    const result = await renderUrl(args.url, {
      token: args.token,
      timeout: args.timeout,
      noJs: args.noJs,
    });

    const data = collectText(result.document);
    return {
      exitCode: 0,
      data: { command: 'text', status: 'ok', ...data },
    };
  } catch (err: any) {
    return {
      exitCode: 1,
      data: { command: 'text', error: err.message },
      errors: [{ code: 'TEXT_ERROR', message: err.message }],
    };
  }
}
