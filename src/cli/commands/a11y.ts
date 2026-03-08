import type { ParsedArgs, CommandResult } from '../types';
import { renderUrl } from './render';
import { collectA11y } from '../../collectors/a11y';

export async function execute(args: ParsedArgs): Promise<CommandResult> {
  if (!args.url) {
    return {
      exitCode: 1,
      data: { command: 'a11y', error: 'a11y requires a URL' },
      errors: [{ code: 'MISSING_URL', message: 'a11y requires a URL' }],
    };
  }

  try {
    const result = await renderUrl(args.url, {
      token: args.token,
      timeout: args.timeout,
      noJs: args.noJs,
    });

    const data = collectA11y(result.document);
    return {
      exitCode: 0,
      data: { command: 'a11y', status: 'ok', ...data },
    };
  } catch (err: any) {
    return {
      exitCode: 1,
      data: { command: 'a11y', error: err.message },
      errors: [{ code: 'A11Y_ERROR', message: err.message }],
    };
  }
}
