import { describe, it, expect } from 'vitest';
import { renderUrl } from './render';

// Settle-loop regression: pages WITHOUT a #root element must not wait out the
// full timeout. Before the fix, renderUrl passed waitForSelector '#root > *'
// unconditionally, so flushReactRender reset its stability counter every 100ms
// round until the deadline — every static (non-React) page burned the entire
// --timeout and returned stable:false.

const STATIC_PAGE =
  'data:text/html,' +
  encodeURIComponent(
    '<html><head><title>Careers</title></head><body>' +
      '<h1>Open Positions</h1><ul>' +
      '<li><a href="/jobs/1">Engineer 1</a></li>' +
      '<li><a href="/jobs/2">Engineer 2</a></li>' +
      '</ul></body></html>',
  );

const SPA_PAGE =
  'data:text/html,' +
  encodeURIComponent(
    '<html><body><div id="root"></div><script>' +
      'setTimeout(function(){' +
      "var el=document.createElement('div');el.textContent='mounted';" +
      "document.getElementById('root').appendChild(el);" +
      '},50);' +
      '</script></body></html>',
  );

describe('renderUrl settle behavior', () => {
  it('settles a static page (no #root) well before the timeout', async () => {
    const timeout = 5000;
    const start = Date.now();
    const result = await renderUrl(STATIC_PAGE, { timeout });
    const wall = Date.now() - start;
    expect(result.document.querySelectorAll('a').length).toBe(2);
    // Must exit via stability, not deadline. Generous margin for slow CI.
    expect(wall).toBeLessThan(timeout - 1500);
  });

  it('still waits for the SPA mount when #root exists', async () => {
    const result = await renderUrl(SPA_PAGE, { timeout: 5000 });
    const root = result.document.querySelector('#root');
    expect(root).toBeTruthy();
    expect(root.textContent).toContain('mounted');
  });
});
