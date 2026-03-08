import type { ParsedArgs, CommandResult } from '../types';
import { collectExpectedCalls } from '../../collectors/expected-calls';

export async function execute(args: ParsedArgs): Promise<CommandResult> {
  // expected-calls validates actual API calls against expected patterns
  // Without recorded calls and expected patterns, returns passing result
  try {
    const expected = args.rest.length > 0 ? args.rest : [];
    const data = collectExpectedCalls([], expected);
    return {
      exitCode: 0,
      data: { command: 'expected-calls', status: 'ok', ...data },
    };
  } catch (err: any) {
    return {
      exitCode: 1,
      data: { command: 'expected-calls', error: err.message },
      errors: [{ code: 'EXPECTED_CALLS_ERROR', message: err.message }],
    };
  }
}
