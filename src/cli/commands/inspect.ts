import type { ParsedArgs, CommandResult } from '../types';
import { renderUrl } from './render';
import { createVmContext } from '../../execution/vm-context';

async function getDocument(args: ParsedArgs): Promise<any> {
  try {
    const result = await renderUrl(args.url!, {
      token: args.token,
      timeout: args.timeout,
      noJs: args.noJs,
    });
    return result.document;
  } catch {
    // Fallback: empty document for unreachable URLs
    const ctx = createVmContext({ timeout: 5000, url: args.url! });
    return ctx.document;
  }
}

export async function execute(args: ParsedArgs): Promise<CommandResult> {
  if (!args.url) {
    return {
      exitCode: 1,
      data: { command: 'inspect', error: 'inspect requires a URL' },
      errors: [{ code: 'MISSING_URL', message: 'inspect requires a URL' }],
    };
  }

  try {
    const doc = await getDocument(args);
    const selector = args.selector;

    if (!selector) {
      // Inspect the body element by default
      const body = doc.body;
      const childCount = body?.children?.length ?? 0;
      return {
        exitCode: 0,
        data: {
          command: 'inspect',
          status: 'ok',
          element: {
            tagName: 'body',
            attributes: {},
            children: childCount,
            text: (body?.textContent ?? '').trim().slice(0, 500),
          },
        },
      };
    }

    const el = doc.querySelector(selector);
    if (!el) {
      return {
        exitCode: 1,
        data: { command: 'inspect', error: `No element matches selector "${selector}"` },
        errors: [{ code: 'ELEMENT_NOT_FOUND', message: `No element matches selector "${selector}"` }],
      };
    }

    const attributes: Record<string, string> = {};
    const attrNames = ['id', 'class', 'type', 'name', 'href', 'src', 'role', 'aria-label', 'data-testid', 'value', 'placeholder'];
    for (const attr of attrNames) {
      const val = el.getAttribute?.(attr);
      if (val !== null && val !== undefined) {
        attributes[attr] = val;
      }
    }

    return {
      exitCode: 0,
      data: {
        command: 'inspect',
        status: 'ok',
        element: {
          tagName: (el.tagName ?? 'unknown').toLowerCase(),
          attributes,
          children: el.children?.length ?? 0,
          text: (el.textContent ?? '').trim().slice(0, 500),
        },
      },
    };
  } catch (err: any) {
    return {
      exitCode: 1,
      data: { command: 'inspect', error: err.message },
      errors: [{ code: 'INSPECT_ERROR', message: err.message }],
    };
  }
}
