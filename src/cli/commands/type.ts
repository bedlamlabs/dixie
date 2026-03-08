import type { ParsedArgs, CommandResult } from '../types';
import { renderUrl } from './render';
import { type as typeInto } from '../../interaction/type';

export async function execute(args: ParsedArgs): Promise<CommandResult> {
  if (!args.url) {
    return {
      exitCode: 1,
      data: { command: 'type', error: 'type requires a URL' },
      errors: [{ code: 'MISSING_URL', message: 'type requires a URL' }],
    };
  }

  if (!args.selector) {
    return {
      exitCode: 1,
      data: { command: 'type', error: 'type requires a selector' },
      errors: [{ code: 'MISSING_SELECTOR', message: 'type requires a CSS selector' }],
    };
  }

  const text = args.rest[0] ?? '';

  try {
    const result = await renderUrl(args.url, {
      token: args.token,
      timeout: args.timeout,
      noJs: args.noJs,
    });

    typeInto(result.document, args.selector, text);
    return {
      exitCode: 0,
      data: { command: 'type', status: 'ok', selector: args.selector, text },
    };
  } catch (err: any) {
    return {
      exitCode: 1,
      data: { command: 'type', error: err.message },
      errors: [{ code: 'TYPE_ERROR', message: err.message }],
    };
  }
}
