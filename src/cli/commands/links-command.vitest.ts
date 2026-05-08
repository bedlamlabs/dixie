import { describe, expect, it } from 'vitest';
import { execute } from './links';
import type { ParsedArgs } from '../types';

function args(url: string): ParsedArgs {
  return {
    command: 'links',
    url,
    format: 'json',
    timeout: 1000,
    noJs: false,
    parallel: false,
    verbose: false,
    bail: false,
    noColor: false,
    selectorStrategy: 'css',
    samples: 100,
    rest: [],
  };
}

describe('links command', () => {
  it('collects static links without executing page JavaScript', async () => {
    const html = `
      <html><body>
        <a href="/static-job">Static Job</a>
        <script>
          console.log('this must not pollute stdout');
          document.body.innerHTML += '<a href="/scripted-job">Scripted Job</a>';
        </script>
      </body></html>
    `;

    const result = await execute(args(`data:text/html,${encodeURIComponent(html)}`));

    expect(result.exitCode).toBe(0);
    expect(result.data.links).toEqual([
      { tag: 'a', text: 'Static Job', href: '/static-job' },
    ]);
  });
});

