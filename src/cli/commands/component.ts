import type { ParsedArgs, CommandResult } from '../types';
import { renderUrl } from './render';
import { createVmContext } from '../../execution/vm-context';

interface ComponentNode {
  tag: string;
  testId?: string;
  children: ComponentNode[];
}

function walkForComponents(el: any, depth: number, maxDepth: number): ComponentNode[] {
  if (depth > maxDepth) return [];

  const nodes: ComponentNode[] = [];
  const children = el.children ?? [];

  for (const child of children) {
    const testId = child.getAttribute?.('data-testid');
    const reactRoot = child.hasAttribute?.('data-reactroot');
    const tag = (child.tagName ?? 'unknown').toLowerCase();

    if (testId || reactRoot) {
      const node: ComponentNode = {
        tag,
        children: walkForComponents(child, depth + 1, maxDepth),
      };
      if (testId) node.testId = testId;
      nodes.push(node);
    } else {
      // Keep searching children even if this node isn't a component marker
      nodes.push(...walkForComponents(child, depth + 1, maxDepth));
    }
  }

  return nodes;
}

export async function execute(args: ParsedArgs): Promise<CommandResult> {
  if (!args.url) {
    return {
      exitCode: 1,
      data: { command: 'component', error: 'component requires a URL' },
      errors: [{ code: 'MISSING_URL', message: 'component requires a URL' }],
    };
  }

  try {
    let doc: any;
    try {
      const result = await renderUrl(args.url, {
        token: args.token,
        timeout: args.timeout,
        noJs: args.noJs,
      });
      doc = result.document;
    } catch {
      const ctx = createVmContext({ timeout: 5000, url: args.url });
      doc = ctx.document;
    }

    const tree = walkForComponents(doc.body ?? doc, 0, 10);
    return {
      exitCode: 0,
      data: { command: 'component', status: 'ok', tree },
    };
  } catch (err: any) {
    return {
      exitCode: 1,
      data: { command: 'component', error: err.message },
      errors: [{ code: 'COMPONENT_ERROR', message: err.message }],
    };
  }
}
