import type { ParsedArgs, CommandResult } from '../types';
import { renderUrl } from './render';
import { collectCssAudit } from '../../collectors/css-audit';

export async function execute(args: ParsedArgs): Promise<CommandResult> {
  if (!args.url) {
    return {
      exitCode: 1,
      data: { command: 'css-audit', error: 'css-audit requires a URL' },
      errors: [{ code: 'MISSING_URL', message: 'css-audit requires a URL' }],
    };
  }

  try {
    const result = await renderUrl(args.url, {
      token: args.token,
      timeout: args.timeout,
      noJs: args.noJs,
    });

    const data = collectCssAudit(result.document);
    return {
      exitCode: 0,
      data: { command: 'css-audit', status: 'ok', ...data },
    };
  } catch (err: any) {
    return {
      exitCode: 1,
      data: { command: 'css-audit', error: err.message },
      errors: [{ code: 'CSS_AUDIT_ERROR', message: err.message }],
    };
  }
}
