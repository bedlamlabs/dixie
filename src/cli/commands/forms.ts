import type { ParsedArgs, CommandResult } from '../types';
import { renderUrl } from './render';
import { collectForms } from '../../collectors/forms';

export async function execute(args: ParsedArgs): Promise<CommandResult> {
  if (!args.url) {
    return {
      exitCode: 1,
      data: { command: 'forms', error: 'forms requires a URL' },
      errors: [{ code: 'MISSING_URL', message: 'forms requires a URL' }],
    };
  }

  try {
    const result = await renderUrl(args.url, {
      token: args.token,
      timeout: args.timeout,
      noJs: args.noJs,
    });

    const data = collectForms(result.document);
    return {
      exitCode: 0,
      data: { command: 'forms', status: 'ok', ...data },
    };
  } catch (err: any) {
    return {
      exitCode: 1,
      data: { command: 'forms', error: err.message },
      errors: [{ code: 'FORMS_ERROR', message: err.message }],
    };
  }
}
