import type { ParsedArgs, CommandResult } from '../types';
import { renderUrl } from './render';
import { select } from '../../interaction/select';

export async function execute(args: ParsedArgs): Promise<CommandResult> {
  if (!args.url) {
    return {
      exitCode: 1,
      data: { command: 'select', error: 'select requires a URL' },
      errors: [{ code: 'MISSING_URL', message: 'select requires a URL' }],
    };
  }

  if (!args.selector) {
    return {
      exitCode: 1,
      data: { command: 'select', error: 'select requires a selector' },
      errors: [{ code: 'MISSING_SELECTOR', message: 'select requires a CSS selector' }],
    };
  }

  const value = args.rest[0] ?? '';

  try {
    const result = await renderUrl(args.url, {
      token: args.token,
      timeout: args.timeout,
      noJs: args.noJs,
    });

    select(result.document, args.selector, value);
    return {
      exitCode: 0,
      data: { command: 'select', status: 'ok', selector: args.selector, value },
    };
  } catch (err: any) {
    return {
      exitCode: 1,
      data: { command: 'select', error: err.message },
      errors: [{ code: 'SELECT_ERROR', message: err.message }],
    };
  }
}
