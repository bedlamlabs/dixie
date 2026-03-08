import type { ParsedArgs, CommandResult } from '../types';
import { renderUrl } from './render';
import { getByTestId, getAllByTestId } from '../../queries/test-id';
import { getByRole, getAllByRole } from '../../queries/role';
import { getByLabel, getAllByLabel } from '../../queries/label';

export async function execute(args: ParsedArgs): Promise<CommandResult> {
  if (!args.url) {
    return {
      exitCode: 1,
      data: { command: 'query', error: 'query requires a URL' },
      errors: [{ code: 'MISSING_URL', message: 'query requires a URL' }],
    };
  }

  const selector = args.selector ?? '';

  try {
    const result = await renderUrl(args.url, {
      token: args.token,
      timeout: args.timeout,
      noJs: args.noJs,
    });

    const doc = result.document;
    let elements: any[] = [];

    if (!selector) {
      return {
        exitCode: 0,
        data: { command: 'query', status: 'ok', strategy: args.selectorStrategy, results: [] },
      };
    }

    switch (args.selectorStrategy) {
      case 'testId':
        elements = getAllByTestId(doc, selector);
        break;
      case 'role':
        elements = getAllByRole(doc, selector);
        break;
      case 'label':
        elements = getAllByLabel(doc, selector);
        break;
      case 'css':
      default:
        elements = Array.from(doc.querySelectorAll(selector));
        break;
    }

    const results = elements.map((el: any) => ({
      tagName: el.tagName?.toLowerCase() ?? 'unknown',
      text: (el.textContent ?? '').trim().slice(0, 200),
      id: el.getAttribute?.('id') ?? undefined,
    }));

    return {
      exitCode: 0,
      data: { command: 'query', status: 'ok', strategy: args.selectorStrategy, count: results.length, results },
    };
  } catch (err: any) {
    return {
      exitCode: 1,
      data: { command: 'query', error: err.message },
      errors: [{ code: 'QUERY_ERROR', message: err.message }],
    };
  }
}
