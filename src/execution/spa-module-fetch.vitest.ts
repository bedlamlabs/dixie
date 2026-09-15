/**
 * Roadmap #95 — Dixie could not render a Vite production SPA served from
 * http://localhost.
 *
 * On the reporting host every getaddrinfo("localhost") took ~5s (macOS, no
 * `::1 localhost` in /etc/hosts). Node's fetch resolves each chunk request
 * through that resolver, so the entry's static chunk imports and the lazy
 * route chunk queued up until "Script bundling timed out" / "fetch failed",
 * and the page rendered an empty <body>. Browsers never consult the resolver
 * for localhost, so the page works fine in Chrome.
 *
 * These tests make the resolver slow on purpose (stubbed dns.lookup) so the
 * failure is reproducible on any machine, then serve a Vite-shaped SPA from a
 * local fixture server: hashed entry chunk, a shared vendor chunk, and a
 * route chunk loaded with dynamic import().
 */

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import * as http from 'node:http';
import dns from 'node:dns';
import type { AddressInfo } from 'node:net';
import { renderUrl } from '../cli/commands/render';

const SLOW_LOOKUP_MS = 4000;

const HTML = `<!doctype html>
<html lang="en">
  <head>
    <title>Fixture SPA</title>
    <script type="module" crossorigin src="/assets/app-a1b2c3.js"></script>
    <link rel="modulepreload" crossorigin href="/assets/vendor-d4e5f6.js">
    <script>window.__FIXTURE_CONTENT__={"heading":"Lazy route rendered"};</script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

const FILES: Record<string, string> = {
  '/assets/vendor-d4e5f6.js':
    'export function h(tag,text){const el=document.createElement(tag);el.textContent=text;return el;}',
  // Mirrors what Vite 7 / rolldown emits: the modulepreload polyfill, the
  // __vitePreload helper (resolves deps via import.meta.url, waits for CSS
  // <link> load events), and a lazy route loaded through it.
  '/assets/app-a1b2c3.js': [
    'import{h as e}from"./vendor-d4e5f6.js";',
    '(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;',
    'for(const l of document.querySelectorAll(\'link[rel="modulepreload"]\'))p(l);',
    'function p(l){if(l.ep)return;l.ep=!0;fetch(l.href,{credentials:"same-origin"})}})();',
    'var deps=["assets/LazyRoute-0a9b8c.js","assets/vendor-d4e5f6.js","assets/LazyRoute-77aa11.css"];',
    'var seen={};',
    'var preload=function(load,deps){let r=Promise.resolve();if(deps&&deps.length>0){const links=document.getElementsByTagName("link");',
    'r=Promise.all(deps.map(d=>{d="/"+d;d=new URL(d,import.meta.url).href;if(d in seen)return;seen[d]=!0;const css=d.endsWith(".css");',
    'for(let i=links.length-1;i>=0;i--){const l=links[i];if(l.href===d&&(!css||l.rel==="stylesheet"))return}',
    'const l=document.createElement("link");l.rel=css?"stylesheet":"modulepreload";css||(l.as="script");l.crossOrigin="";l.href=d;document.head.appendChild(l);',
    'if(css)return new Promise((res,rej)=>{l.addEventListener("load",res);l.addEventListener("error",()=>rej(Error("Unable to preload CSS for "+d)))})}))}',
    'return r.then(()=>load())};',
    'const root=document.getElementById("root");',
    'const theme=document.documentElement.dataset.theme===`dark`?`dark`:`light`;',
    'root.appendChild(e("nav","Shell nav "+theme));',
    'preload(()=>import("./LazyRoute-0a9b8c.js"),deps).then(m=>{root.appendChild(m.default());},err=>{window.__lazyError=String(err&&err.stack||err);});',
  ].join('\n'),
  '/assets/LazyRoute-77aa11.css': 'h1{color:red}',
  '/assets/LazyRoute-0a9b8c.js': [
    'import{h as e}from"./vendor-d4e5f6.js";',
    'export default function LazyRoute(){const main=e("main","");main.appendChild(e("h1","Lazy route rendered"));main.appendChild(e("p","Step 1 of 8"));return main;}',
  ].join('\n'),
};

let server: http.Server;
let port: number;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    const path = (req.url ?? '/').split('?')[0];
    const body = FILES[path];
    if (body !== undefined) {
      res.writeHead(200, { 'Content-Type': 'text/javascript' });
      res.end(body);
    } else if (path.startsWith('/app/')) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(HTML);
    } else {
      res.writeHead(404);
      res.end('not found');
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  port = (server.address() as AddressInfo).port;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** Make the OS resolver behave like the reporting host: slow for localhost. */
function stubSlowLocalhostResolver() {
  const realLookup = dns.lookup;
  return vi.spyOn(dns, 'lookup').mockImplementation(((hostname: string, ...rest: any[]) => {
    if (hostname === 'localhost') {
      setTimeout(() => (realLookup as any).call(dns, hostname, ...rest), SLOW_LOOKUP_MS);
      return;
    }
    return (realLookup as any).call(dns, hostname, ...rest);
  }) as any);
}

describe('roadmap #95: Vite SPA with lazy route chunk on http://localhost', () => {
  it('renders the lazy route chunk even when the OS resolver is slow for localhost', async () => {
    const lookup = stubSlowLocalhostResolver();

    const result = await renderUrl(`http://localhost:${port}/app/lazy`, {
      timeout: 6000,
      config: { isSPA: true } as any,
    });
    try {
      const scriptErrors = result.errors.filter((e) => e.code.startsWith('SCRIPT_'));
      expect(scriptErrors).toEqual([]);
      expect((result.context.window as any).__lazyError).toBeUndefined();
      expect(result.document.querySelector('#root main h1')?.textContent).toBe('Lazy route rendered');
      expect(result.document.querySelector('#root main p')?.textContent).toBe('Step 1 of 8');
      // Browsers never ask the resolver about localhost; neither should Dixie.
      expect(lookup.mock.calls.filter((c) => c[0] === 'localhost')).toEqual([]);
    } finally {
      result.dispose();
    }
  }, 30000);
});

describe('<link> element reflects the properties Vite chunks read', () => {
  it('resolves href against the page URL and exposes rel/as/crossOrigin', async () => {
    const { createVmContext } = await import('./vm-context');
    const ctx = createVmContext({ url: 'http://localhost:5001/app/onboarding' });
    const link = ctx.document.createElement('link') as any;
    link.rel = 'modulepreload';
    link.as = 'script';
    link.crossOrigin = '';
    link.href = '/assets/app-a1b2c3.js';

    expect(link.getAttribute('href')).toBe('/assets/app-a1b2c3.js');
    expect(link.href).toBe('http://localhost:5001/assets/app-a1b2c3.js');
    expect(link.rel).toBe('modulepreload');
    expect(link.getAttribute('as')).toBe('script');
    // crossorigin="" reflects as "anonymous" (HTML CORS settings attribute).
    expect(link.crossOrigin).toBe('anonymous');
    expect(link.relList.supports('modulepreload')).toBe(true);
    expect(link.relList.contains('modulepreload')).toBe(true);
  });

  it('fires load for a stylesheet link once it is inserted into the document', async () => {
    const { createVmContext } = await import('./vm-context');
    const ctx = createVmContext({ url: 'http://localhost:5001/app/onboarding' });
    const link = ctx.document.createElement('link') as any;
    link.rel = 'stylesheet';
    link.href = '/assets/app.css';
    const loaded = new Promise<string>((resolve) => link.addEventListener('load', (e: any) => resolve(e.type)));
    ctx.document.head.appendChild(link);

    await expect(Promise.race([loaded, new Promise((r) => setTimeout(() => r('no load event'), 500))])).resolves.toBe('load');
  });
});

describe('element.dataset', () => {
  it('maps data-* attributes to camelCase properties in both directions', async () => {
    const { createVmContext } = await import('./vm-context');
    const ctx = createVmContext({ url: 'http://localhost:5001/' });
    const html = ctx.document.documentElement as any;

    expect(html.dataset.theme).toBeUndefined();
    html.setAttribute('data-theme', 'dark');
    html.setAttribute('data-nav-state', 'open');
    expect(html.dataset.theme).toBe('dark');
    expect(html.dataset.navState).toBe('open');

    const div = ctx.document.createElement('div') as any;
    div.dataset.precedence = 'default';
    div.dataset.fooBarBaz = '1';
    expect(div.getAttribute('data-precedence')).toBe('default');
    expect(div.getAttribute('data-foo-bar-baz')).toBe('1');
    expect('fooBarBaz' in div.dataset).toBe(true);
    expect(Object.keys(div.dataset).sort()).toEqual(['fooBarBaz', 'precedence']);

    delete div.dataset.precedence;
    expect(div.hasAttribute('data-precedence')).toBe(false);
  });
});

describe('page globals: WebSocket and EventSource', () => {
  it('exposes the WebSocket and EventSource constructors to page scripts', async () => {
    const { createVmContext } = await import('./vm-context');
    const ctx = createVmContext({ url: 'http://localhost:5001/app/onboarding' });
    const result = ctx.executeScript(`
      window.__wsOpen = WebSocket.OPEN;
      var ws = new WebSocket('ws://' + location.host + '/ws');
      window.__wsState = ws.readyState;
      window.__esType = typeof EventSource;
    `);
    expect(result.error).toBeUndefined();
    expect((ctx.window as any).__wsOpen).toBe(1);
    expect((ctx.window as any).__wsState).toBe(0);
    expect((ctx.window as any).__esType).toBe('function');
  });
});

describe('location accepts relative URLs', () => {
  it('resolves replace/assign/href against the current URL, as browsers do', async () => {
    const { Location } = await import('../browser/Location');
    const loc = new Location('http://localhost:5001/app/onboarding?section=onboarding');

    loc.replace('/login?returnTo=%2Fapp%2Fonboarding');
    expect(loc.href).toBe('http://localhost:5001/login?returnTo=%2Fapp%2Fonboarding');

    loc.assign('feed');
    expect(loc.href).toBe('http://localhost:5001/feed');

    loc.href = '?tab=saved';
    expect(loc.href).toBe('http://localhost:5001/feed?tab=saved');

    loc.href = 'https://jobsift.app/pricing';
    expect(loc.href).toBe('https://jobsift.app/pricing');
  });
});

describe('LiveFetch accepts every RequestInfo shape', () => {
  it('fetches a URL object without throwing on input.url', async () => {
    const { LiveFetch } = await import('../fetch/LiveFetch');
    const live = new LiveFetch({ pageUrl: `http://127.0.0.1:${port}/app/x`, userAgent: 'dixie-test' });
    const res = await live.fetch(new URL(`http://127.0.0.1:${port}/assets/vendor-d4e5f6.js`) as any);
    expect(res.status).toBe(200);
    expect(live.getRequests()[0].url).toBe(`http://127.0.0.1:${port}/assets/vendor-d4e5f6.js`);
  });

  it('resolves relative URLs against the page URL', async () => {
    const { LiveFetch } = await import('../fetch/LiveFetch');
    const live = new LiveFetch({ pageUrl: `http://127.0.0.1:${port}/app/x`, userAgent: 'dixie-test' });
    const res = await live.fetch('/assets/vendor-d4e5f6.js');
    expect(res.status).toBe(200);
    expect(live.getRequests()[0].url).toBe(`http://127.0.0.1:${port}/assets/vendor-d4e5f6.js`);
  });
});

describe('query --text ignores script and style source', () => {
  const baseArgs = {
    command: 'query',
    format: 'json',
    timeout: 2000,
    noJs: false,
    parallel: false,
    verbose: false,
    bail: false,
    noColor: false,
    selectorStrategy: 'css',
    samples: 100,
    rest: [],
  } as any;

  const page = (body: string) =>
    `data:text/html,${encodeURIComponent(
      `<html><head><script>window.__BLOB__={"cta":"Choose your subscription"};</script>` +
        `<style>.x::after{content:"Choose your subscription"}</style></head><body>${body}</body></html>`,
    )}`;

  it('does not report "found" when the text exists only inside <script>/<style>', async () => {
    const { execute } = await import('../cli/commands/query');
    const result = await execute({ ...baseArgs, url: page('<div id="root"></div>'), text: 'Choose your subscription' });

    expect(result.data.status).toBe('not-found');
    expect(result.data.count).toBe(0);
    expect(result.exitCode).toBe(1);
  });

  it('still finds the text when it is rendered in the body', async () => {
    const { execute } = await import('../cli/commands/query');
    const result = await execute({
      ...baseArgs,
      url: page('<div id="root"><h2>Choose your subscription</h2></div>'),
      text: 'Choose your subscription',
    });

    expect(result.data.status).toBe('found');
    const tags = result.data.results.map((r: any) => r.tagName);
    expect(tags).toContain('h2');
    expect(tags).not.toContain('script');
    expect(tags).not.toContain('style');
    expect(tags).not.toContain('head');
  });
});
