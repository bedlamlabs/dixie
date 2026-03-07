import type { VmContext } from './vm-context';

const EXECUTABLE_TYPES = new Set([
  '',           // no type attribute = JavaScript
  'text/javascript',
  'application/javascript',
  'module',     // treat as JS (though actual ES module import won't work in vm)
]);

export function loadScripts(ctx: VmContext): void {
  const scripts = ctx.document.querySelectorAll('script');

  for (const script of scripts) {
    const type = (script.getAttribute('type') ?? '').toLowerCase().trim();

    // Skip non-JS scripts (application/json, application/ld+json, etc.)
    if (type && !EXECUTABLE_TYPES.has(type)) {
      continue;
    }

    // Only handle inline scripts — src loading is a future concern
    const src = script.getAttribute('src');
    if (src) {
      continue;
    }

    const code = script.textContent ?? '';
    if (code.trim()) {
      // executeScript throws on timeout, returns { error } for other errors
      ctx.executeScript(code);
    }
  }
}
