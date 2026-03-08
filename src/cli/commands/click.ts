import type { ParsedArgs, CommandResult } from '../types';
import { renderUrl } from './render';
import { click } from '../../interaction/click';

export async function execute(args: ParsedArgs): Promise<CommandResult> {
  if (!args.url) {
    return {
      exitCode: 1,
      data: { command: 'click', error: 'click requires a URL' },
      errors: [{ code: 'MISSING_URL', message: 'click requires a URL' }],
    };
  }

  if (!args.selector) {
    return {
      exitCode: 1,
      data: { command: 'click', error: 'click requires a selector' },
      errors: [{ code: 'MISSING_SELECTOR', message: 'click requires a CSS selector' }],
    };
  }

  try {
    const result = await renderUrl(args.url, {
      token: args.token,
      timeout: args.timeout,
      noJs: args.noJs,
    });

    click(result.document, args.selector);
    return {
      exitCode: 0,
      data: { command: 'click', status: 'ok', selector: args.selector },
    };
  } catch (err: any) {
    return {
      exitCode: 1,
      data: { command: 'click', error: err.message },
      errors: [{ code: 'CLICK_ERROR', message: err.message }],
    };
  }
}
