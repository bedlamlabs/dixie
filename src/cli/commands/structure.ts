import type { ParsedArgs, CommandResult } from '../types';
import { renderUrl } from './render';
import { collectStructure } from '../../collectors/structure';

export async function execute(args: ParsedArgs): Promise<CommandResult> {
  if (!args.url) {
    return {
      exitCode: 1,
      data: { command: 'structure', error: 'structure requires a URL' },
      errors: [{ code: 'MISSING_URL', message: 'structure requires a URL' }],
    };
  }

  try {
    const result = await renderUrl(args.url, {
      token: args.token,
      timeout: args.timeout,
      noJs: args.noJs,
    });

    const data = collectStructure(result.document);
    return {
      exitCode: 0,
      data: { command: 'structure', status: 'ok', ...data },
    };
  } catch (err: any) {
    return {
      exitCode: 1,
      data: { command: 'structure', error: err.message },
      errors: [{ code: 'STRUCTURE_ERROR', message: err.message }],
    };
  }
}
