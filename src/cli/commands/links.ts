import type { ParsedArgs, CommandResult } from '../types';
import { renderUrl } from './render';
import { collectLinks } from '../../collectors/links';

export async function execute(args: ParsedArgs): Promise<CommandResult> {
  if (!args.url) {
    return {
      exitCode: 1,
      data: { command: 'links', error: 'links requires a URL' },
      errors: [{ code: 'MISSING_URL', message: 'links requires a URL' }],
    };
  }

  try {
    const result = await renderUrl(args.url, {
      token: args.token,
      timeout: args.timeout,
      noJs: args.noJs,
    });

    const data = collectLinks(result.document);
    return {
      exitCode: 0,
      data: { command: 'links', status: 'ok', ...data },
    };
  } catch (err: any) {
    return {
      exitCode: 1,
      data: { command: 'links', error: err.message },
      errors: [{ code: 'LINKS_ERROR', message: err.message }],
    };
  }
}
