import type { ParsedArgs, CommandResult } from '../types';
import { renderUrl } from './render';
import { createVmContext } from '../../execution/vm-context';
import { collectA11y } from '../../collectors/a11y';
import { collectLinks } from '../../collectors/links';
import { collectForms } from '../../collectors/forms';
import { collectStructure } from '../../collectors/structure';

export async function execute(args: ParsedArgs): Promise<CommandResult> {
  if (!args.url) {
    return {
      exitCode: 1,
      data: { command: 'lighthouse', error: 'lighthouse requires a URL' },
      errors: [{ code: 'MISSING_URL', message: 'lighthouse requires a URL' }],
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
    const a11y = collectA11y(doc);
    const links = collectLinks(doc);
    const forms = collectForms(doc);
    const structure = collectStructure(doc);

    // Scoring: start at 100, deduct for issues
    const a11yScore = Math.max(0, 100 - a11y.issues.length * 10);
    const linksScore = links.links.length > 0 || links.buttons.length > 0 ? 100 : 50;
    const formsScore = forms.fields.length > 0 ? 100 : 50;
    const structureScore = structure.elementCount > 0 ? 100 : 0;

    const score = Math.round((a11yScore + linksScore + formsScore + structureScore) / 4);

    return {
      exitCode: 0,
      data: {
        command: 'lighthouse',
        status: 'ok',
        score,
        categories: {
          a11y: { score: a11yScore, issues: a11y.issues.length },
          links: { score: linksScore, count: links.links.length },
          forms: { score: formsScore, fields: forms.fields.length },
          structure: { score: structureScore, elements: structure.elementCount },
        },
      },
    };
  } catch (err: any) {
    return {
      exitCode: 1,
      data: { command: 'lighthouse', error: err.message },
      errors: [{ code: 'LIGHTHOUSE_ERROR', message: err.message }],
    };
  }
}
