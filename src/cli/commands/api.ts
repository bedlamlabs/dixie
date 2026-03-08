import type { ParsedArgs, CommandResult } from '../types';
import { collectApi } from '../../collectors/api';

export async function execute(args: ParsedArgs): Promise<CommandResult> {
  // api command collects API call data — without recorded calls, returns empty
  try {
    const data = collectApi([]);
    return {
      exitCode: 0,
      data: { command: 'api', status: 'ok', ...data },
    };
  } catch (err: any) {
    return {
      exitCode: 1,
      data: { command: 'api', error: err.message },
      errors: [{ code: 'API_ERROR', message: err.message }],
    };
  }
}
