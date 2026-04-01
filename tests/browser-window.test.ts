import { describe, it, expect, vi } from 'vitest';
import { Window } from '../src/browser/Window';
import { Location } from '../src/browser/Location';
import { History } from '../src/browser/History';
import { Navigator } from '../src/browser/Navigator';
import { Screen } from '../src/browser/Screen';
import { Event } from '../src/events/Event';

// ═══════════════════════════════════════════════════════════════════
// Screen
// ═══════════════════════════════════════════════════════════════════

describe('Screen', () => {
  it('has default dimensions of 1920x1080', () => {
    const screen = new Screen();
    expect(screen.width).toBe(1920);
    expect(screen.height).toBe(1080);
  });

  it('availWidth/availHeight match width/height by default', () => {
    const screen = new Screen();
    expect(screen.availWidth).toBe(1920);
    expect(screen.availHeight).toBe(1080);
  });

  it('colorDepth and pixelDepth default to 24', () => {
    const screen = new Screen();
    expect(screen.colorDepth).toBe(24);
    expect(screen.pixelDepth).toBe(24);
  });

  it('orientation defaults to landscape-primary at 0 degrees', () => {
    const screen = new Screen();
    expect(screen.orientation.type).toBe('landscape-primary');
    expect(screen.orientation.angle).toBe(0);
  });

  it('accepts custom dimensions', () => {
    const screen = new Screen({ width: 2560, height: 1440 });
    expect(screen.width).toBe(2560);
    expect(screen.height).toBe(1440);
    // availWidth/availHeight default to width/height when not specified
    expect(screen.availWidth).toBe(2560);
    expect(screen.availHeight).toBe(1440);
  });

  it('accepts custom availWidth/availHeight independent of width/height', () => {
    const screen = new Screen({ width: 1920, height: 1080, availWidth: 1900, availHeight: 1060 });
    expect(screen.width).toBe(1920);
    expect(screen.availWidth).toBe(1900);
    expect(screen.availHeight).toBe(1060);
  });

  it('accepts custom colorDepth and pixelDepth', () => {
    const screen = new Screen({ colorDepth: 32, pixelDepth: 32 });
    expect(screen.colorDepth).toBe(32);
    expect(screen.pixelDepth).toBe(32);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Navigator
// ═══════════════════════════════════════════════════════════════════

describe('Navigator', () => {
  it('has realistic Chrome user agent by default', () => {
    const nav = new Navigator();
    expect(nav.userAgent).toContain('Chrome/');
    expect(nav.userAgent).toContain('Mozilla/5.0');
  });

  it('language is en-US', () => {
    const nav = new Navigator();
    expect(nav.language).toBe('en-US');
  });

  it('languages includes en-US and en', () => {
    const nav = new Navigator();
    expect(nav.languages).toEqual(['en-US', 'en']);
  });

  it('platform is Dixie', () => {
    const nav = new Navigator();
    expect(nav.platform).toBe('Dixie');
  });

  it('onLine is true', () => {
    const nav = new Navigator();
    expect(nav.onLine).toBe(true);
  });

  it('cookieEnabled is true', () => {
    const nav = new Navigator();
    expect(nav.cookieEnabled).toBe(true);
  });

  it('hardwareConcurrency is 1', () => {
    const nav = new Navigator();
    expect(nav.hardwareConcurrency).toBe(1);
  });

  it('maxTouchPoints is 0', () => {
    const nav = new Navigator();
    expect(nav.maxTouchPoints).toBe(0);
  });

  it('clipboard.writeText and readText work', async () => {
    const nav = new Navigator();
    await nav.clipboard.writeText('hello clipboard');
    const text = await nav.clipboard.readText();
    expect(text).toBe('hello clipboard');
  });

  it('clipboard.readText returns empty string initially', async () => {
    const nav = new Navigator();
    const text = await nav.clipboard.readText();
    expect(text).toBe('');
  });

  it('mediaDevices.enumerateDevices returns empty array', async () => {
    const nav = new Navigator();
    const devices = await nav.mediaDevices.enumerateDevices();
    expect(devices).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Location
// ═══════════════════════════════════════════════════════════════════

describe('Location', () => {
  it('defaults to about:blank', () => {
    const loc = new Location();
    expect(loc.href).toBe('about:blank');
  });

  it('parses a full URL', () => {
    const loc = new Location('https://example.com:8080/path?q=1#hash');
    expect(loc.protocol).toBe('https:');
    expect(loc.hostname).toBe('example.com');
    expect(loc.port).toBe('8080');
    expect(loc.host).toBe('example.com:8080');
    expect(loc.pathname).toBe('/path');
    expect(loc.search).toBe('?q=1');
    expect(loc.hash).toBe('#hash');
    expect(loc.origin).toBe('https://example.com:8080');
  });

  it('parses a URL without port', () => {
    const loc = new Location('https://example.com/foo');
    expect(loc.port).toBe('');
    expect(loc.host).toBe('example.com');
  });

  it('parses a URL without path', () => {
    const loc = new Location('https://example.com');
    expect(loc.pathname).toBe('/');
  });

  it('parses a URL without search or hash', () => {
    const loc = new Location('https://example.com/page');
    expect(loc.search).toBe('');
    expect(loc.hash).toBe('');
  });

  it('setting href re-parses all components', () => {
    const loc = new Location('https://example.com');
    loc.href = 'http://other.org:3000/new?x=2#anchor';
    expect(loc.protocol).toBe('http:');
    expect(loc.hostname).toBe('other.org');
    expect(loc.port).toBe('3000');
    expect(loc.pathname).toBe('/new');
    expect(loc.search).toBe('?x=2');
    expect(loc.hash).toBe('#anchor');
  });

  it('setting pathname updates href', () => {
    const loc = new Location('https://example.com/old');
    loc.pathname = '/new';
    expect(loc.pathname).toBe('/new');
    expect(loc.href).toContain('/new');
  });

  it('setting search updates href', () => {
    const loc = new Location('https://example.com/page');
    loc.search = '?foo=bar';
    expect(loc.search).toBe('?foo=bar');
    expect(loc.href).toContain('?foo=bar');
  });

  it('setting hash updates href', () => {
    const loc = new Location('https://example.com/page');
    loc.hash = '#section';
    expect(loc.hash).toBe('#section');
    expect(loc.href).toContain('#section');
  });

  it('setting hostname updates href', () => {
    const loc = new Location('https://example.com/page');
    loc.hostname = 'other.com';
    expect(loc.hostname).toBe('other.com');
    expect(loc.href).toContain('other.com');
  });

  it('setting port updates href', () => {
    const loc = new Location('https://example.com/page');
    loc.port = '9090';
    expect(loc.port).toBe('9090');
    expect(loc.href).toContain(':9090');
  });

  it('setting protocol updates href', () => {
    const loc = new Location('https://example.com/page');
    loc.protocol = 'http:';
    expect(loc.protocol).toBe('http:');
    expect(loc.href).toMatch(/^http:/);
  });

  it('setting host updates both hostname and port', () => {
    const loc = new Location('https://example.com/page');
    loc.host = 'newhost.com:4000';
    expect(loc.hostname).toBe('newhost.com');
    expect(loc.port).toBe('4000');
  });

  it('assign() updates href', () => {
    const loc = new Location('https://example.com');
    loc.assign('https://other.com/page');
    expect(loc.href).toBe('https://other.com/page');
  });

  it('replace() updates href', () => {
    const loc = new Location('https://example.com');
    loc.replace('https://other.com/page');
    expect(loc.href).toBe('https://other.com/page');
  });

  it('reload() is a no-op (does not throw)', () => {
    const loc = new Location('https://example.com');
    expect(() => loc.reload()).not.toThrow();
  });

  it('toString() returns href', () => {
    const loc = new Location('https://example.com/path');
    expect(loc.toString()).toBe('https://example.com/path');
    expect(`${loc}`).toBe('https://example.com/path');
  });

  it('handles URLs with encoded characters', () => {
    const loc = new Location('https://example.com/path%20with%20spaces?q=hello%20world');
    expect(loc.pathname).toBe('/path%20with%20spaces');
    expect(loc.search).toBe('?q=hello%20world');
  });

  it('handles URLs with multiple query params', () => {
    const loc = new Location('https://example.com?a=1&b=2&c=3');
    expect(loc.search).toBe('?a=1&b=2&c=3');
  });
});

// ═══════════════════════════════════════════════════════════════════
// History
// ═══════════════════════════════════════════════════════════════════

describe('History', () => {
  it('starts with length 1', () => {
    const history = new History();
    expect(history.length).toBe(1);
  });

  it('state is initially null', () => {
    const history = new History();
    expect(history.state).toBeNull();
  });

  it('pushState adds an entry and updates state', () => {
    const history = new History();
    history.pushState({ page: 1 }, 'Page 1', '/page1');
    expect(history.length).toBe(2);
    expect(history.state).toEqual({ page: 1 });
  });

  it('multiple pushState calls grow the stack', () => {
    const history = new History();
    history.pushState({ page: 1 }, '', '/p1');
    history.pushState({ page: 2 }, '', '/p2');
    history.pushState({ page: 3 }, '', '/p3');
    expect(history.length).toBe(4);
    expect(history.state).toEqual({ page: 3 });
  });

  it('replaceState replaces current entry without growing', () => {
    const history = new History();
    history.pushState({ page: 1 }, '', '/p1');
    expect(history.length).toBe(2);
    history.replaceState({ page: 'replaced' }, '', '/replaced');
    expect(history.length).toBe(2);
    expect(history.state).toEqual({ page: 'replaced' });
  });

  it('back() moves to previous entry', () => {
    const history = new History();
    history.pushState({ page: 1 }, '', '/p1');
    history.pushState({ page: 2 }, '', '/p2');
    history.back();
    expect(history.state).toEqual({ page: 1 });
  });

  it('forward() moves to next entry', () => {
    const history = new History();
    history.pushState({ page: 1 }, '', '/p1');
    history.pushState({ page: 2 }, '', '/p2');
    history.back();
    history.back();
    expect(history.state).toBeNull(); // Initial state
    history.forward();
    expect(history.state).toEqual({ page: 1 });
  });

  it('go(n) navigates by delta', () => {
    const history = new History();
    history.pushState({ page: 1 }, '', '/p1');
    history.pushState({ page: 2 }, '', '/p2');
    history.pushState({ page: 3 }, '', '/p3');
    history.go(-2);
    expect(history.state).toEqual({ page: 1 });
    history.go(1);
    expect(history.state).toEqual({ page: 2 });
  });

  it('go(0) or go() is a no-op', () => {
    const history = new History();
    history.pushState({ page: 1 }, '', '/p1');
    history.go(0);
    expect(history.state).toEqual({ page: 1 });
    history.go();
    expect(history.state).toEqual({ page: 1 });
  });

  it('back() past the beginning is a no-op', () => {
    const history = new History();
    history.back();
    expect(history.state).toBeNull();
    expect(history.length).toBe(1);
  });

  it('forward() past the end is a no-op', () => {
    const history = new History();
    history.forward();
    expect(history.state).toBeNull();
    expect(history.length).toBe(1);
  });

  it('go() with out-of-range delta is a no-op', () => {
    const history = new History();
    history.pushState({ page: 1 }, '', '/p1');
    history.go(-5);
    expect(history.state).toEqual({ page: 1 }); // unchanged
    history.go(5);
    expect(history.state).toEqual({ page: 1 }); // unchanged
  });

  it('pushState after back() truncates forward entries', () => {
    const history = new History();
    history.pushState({ page: 1 }, '', '/p1');
    history.pushState({ page: 2 }, '', '/p2');
    history.pushState({ page: 3 }, '', '/p3');
    expect(history.length).toBe(4);
    history.back();
    history.back();
    expect(history.state).toEqual({ page: 1 });
    history.pushState({ page: 'new' }, '', '/new');
    expect(history.length).toBe(3); // initial + p1 + new
    expect(history.state).toEqual({ page: 'new' });
  });

  it('dispatches popstate on window when navigating', () => {
    const win = new Window();
    const history = new History();
    history._window = win;
    history.pushState({ page: 1 }, '', '/p1');
    history.pushState({ page: 2 }, '', '/p2');

    const states: unknown[] = [];
    win.addEventListener('popstate', ((e: any) => {
      states.push(e.state);
    }) as any);

    history.back();
    expect(states).toHaveLength(1);
    expect(states[0]).toEqual({ page: 1 });
  });

  it('does not dispatch popstate on pushState or replaceState', () => {
    const win = new Window();
    const history = new History();
    history._window = win;

    let called = false;
    win.addEventListener('popstate', (() => {
      called = true;
    }) as any);

    history.pushState({ a: 1 }, '', '/a');
    history.replaceState({ b: 2 }, '', '/b');
    expect(called).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Window
// ═══════════════════════════════════════════════════════════════════

describe('Window', () => {
  // ── Constructor & Sub-objects ────────────────────────────────────

  it('creates with all sub-objects', () => {
    const win = new Window();
    expect(win.location).toBeInstanceOf(Location);
    expect(win.history).toBeInstanceOf(History);
    expect(win.navigator).toBeInstanceOf(Navigator);
    expect(win.screen).toBeInstanceOf(Screen);
  });

  it('document is null initially', () => {
    const win = new Window();
    expect(win.document).toBeNull();
  });

  it('document can be set externally', () => {
    const win = new Window();
    const doc = { nodeType: 9 };
    win.document = doc;
    expect(win.document).toBe(doc);
  });

  it('accepts custom URL', () => {
    const win = new Window({ url: 'https://example.com/app' });
    expect(win.location.href).toBe('https://example.com/app');
  });

  // ── Viewport ────────────────────────────────────────────────────

  it('default viewport is 1024x768', () => {
    const win = new Window();
    expect(win.innerWidth).toBe(1024);
    expect(win.innerHeight).toBe(768);
    expect(win.outerWidth).toBe(1024);
    expect(win.outerHeight).toBe(768);
  });

  it('accepts custom viewport dimensions', () => {
    const win = new Window({ innerWidth: 1920, innerHeight: 1080 });
    expect(win.innerWidth).toBe(1920);
    expect(win.innerHeight).toBe(1080);
    expect(win.outerWidth).toBe(1920);
    expect(win.outerHeight).toBe(1080);
  });

  it('devicePixelRatio defaults to 1', () => {
    const win = new Window();
    expect(win.devicePixelRatio).toBe(1);
  });

  it('accepts custom devicePixelRatio', () => {
    const win = new Window({ devicePixelRatio: 2 });
    expect(win.devicePixelRatio).toBe(2);
  });

  // ── Self-references ─────────────────────────────────────────────

  it('self returns this', () => {
    const win = new Window();
    expect(win.self).toBe(win);
  });

  it('window returns this', () => {
    const win = new Window();
    expect(win.window).toBe(win);
  });

  it('globalThis returns this', () => {
    const win = new Window();
    expect(win.globalThis).toBe(win);
  });

  it('top returns this', () => {
    const win = new Window();
    expect(win.top).toBe(win);
  });

  it('parent returns this', () => {
    const win = new Window();
    expect(win.parent).toBe(win);
  });

  it('frames returns this', () => {
    const win = new Window();
    expect(win.frames).toBe(win);
  });

  // ── Identity properties ─────────────────────────────────────────

  it('frameElement is null', () => {
    const win = new Window();
    expect(win.frameElement).toBeNull();
  });

  it('name is empty string', () => {
    const win = new Window();
    expect(win.name).toBe('');
  });

  it('closed is false', () => {
    const win = new Window();
    expect(win.closed).toBe(false);
  });

  // ── Scroll ──────────────────────────────────────────────────────

  it('scrollX and scrollY default to 0', () => {
    const win = new Window();
    expect(win.scrollX).toBe(0);
    expect(win.scrollY).toBe(0);
  });

  it('pageXOffset and pageYOffset are aliases for scrollX/scrollY', () => {
    const win = new Window();
    win.scrollX = 100;
    win.scrollY = 200;
    expect(win.pageXOffset).toBe(100);
    expect(win.pageYOffset).toBe(200);
  });

  it('scrollTo sets scrollX and scrollY', () => {
    const win = new Window();
    win.scrollTo(50, 100);
    expect(win.scrollX).toBe(50);
    expect(win.scrollY).toBe(100);
  });

  it('scroll is an alias for scrollTo', () => {
    const win = new Window();
    win.scroll(30, 60);
    expect(win.scrollX).toBe(30);
    expect(win.scrollY).toBe(60);
  });

  it('scrollBy adds to current scroll position', () => {
    const win = new Window();
    win.scrollTo(10, 20);
    win.scrollBy(5, 15);
    expect(win.scrollX).toBe(15);
    expect(win.scrollY).toBe(35);
  });

  // ── getComputedStyle ────────────────────────────────────────────

  it('getComputedStyle returns empty string for any property', () => {
    const win = new Window();
    const style = win.getComputedStyle({});
    expect(style.display).toBe('');
    expect(style.color).toBe('');
    expect(style.fontSize).toBe('');
    expect(style.margin).toBe('');
    expect(style.padding).toBe('');
  });

  it('getComputedStyle returns empty string for unknown properties', () => {
    const win = new Window();
    const style = win.getComputedStyle({});
    expect(style['nonExistentProperty']).toBe('');
    expect(style['someRandomThing']).toBe('');
  });

  // ── matchMedia ──────────────────────────────────────────────────

  it('matchMedia returns correct shape', () => {
    const win = new Window();
    const mql = win.matchMedia('(min-width: 768px)');
    expect(mql.matches).toBe(false);
    expect(mql.media).toBe('(min-width: 768px)');
    expect(mql.onchange).toBeNull();
    expect(typeof mql.addListener).toBe('function');
    expect(typeof mql.removeListener).toBe('function');
    expect(typeof mql.addEventListener).toBe('function');
    expect(typeof mql.removeEventListener).toBe('function');
    expect(typeof mql.dispatchEvent).toBe('function');
  });

  it('matchMedia preserves the query string', () => {
    const win = new Window();
    const mql = win.matchMedia('(prefers-color-scheme: dark)');
    expect(mql.media).toBe('(prefers-color-scheme: dark)');
  });

  it('matchMedia methods are callable without error', () => {
    const win = new Window();
    const mql = win.matchMedia('(max-width: 600px)');
    expect(() => mql.addListener(() => {})).not.toThrow();
    expect(() => mql.removeListener(() => {})).not.toThrow();
    expect(() => mql.addEventListener('change', () => {})).not.toThrow();
    expect(() => mql.removeEventListener('change', () => {})).not.toThrow();
    expect(mql.dispatchEvent({} as any)).toBe(true);
  });

  // ── atob / btoa ─────────────────────────────────────────────────

  it('btoa encodes to base64', () => {
    const win = new Window();
    expect(win.btoa('Hello, World!')).toBe('SGVsbG8sIFdvcmxkIQ==');
  });

  it('atob decodes from base64', () => {
    const win = new Window();
    expect(win.atob('SGVsbG8sIFdvcmxkIQ==')).toBe('Hello, World!');
  });

  it('btoa/atob roundtrip', () => {
    const win = new Window();
    const original = 'Test data with special chars: !@#$%';
    const encoded = win.btoa(original);
    const decoded = win.atob(encoded);
    expect(decoded).toBe(original);
  });

  it('atob handles empty string', () => {
    const win = new Window();
    expect(win.atob('')).toBe('');
  });

  it('btoa handles empty string', () => {
    const win = new Window();
    expect(win.btoa('')).toBe('');
  });

  // ── requestAnimationFrame / cancelAnimationFrame ────────────────

  it('requestAnimationFrame calls callback', async () => {
    const win = new Window();
    let called = false;
    win.requestAnimationFrame(() => {
      called = true;
    });
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(called).toBe(true);
  });

  it('cancelAnimationFrame prevents callback', async () => {
    const win = new Window();
    let called = false;
    const id = win.requestAnimationFrame(() => {
      called = true;
    });
    win.cancelAnimationFrame(id);
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(called).toBe(false);
  });

  // ── getSelection ────────────────────────────────────────────────

  it('getSelection returns null', () => {
    const win = new Window();
    expect(win.getSelection()).toBeNull();
  });

  // ── Lifecycle no-ops ────────────────────────────────────────────

  it('focus() does not throw', () => {
    const win = new Window();
    expect(() => win.focus()).not.toThrow();
  });

  it('blur() does not throw', () => {
    const win = new Window();
    expect(() => win.blur()).not.toThrow();
  });

  it('open() does not throw', () => {
    const win = new Window();
    expect(() => win.open()).not.toThrow();
  });

  it('close() does not throw', () => {
    const win = new Window();
    expect(() => win.close()).not.toThrow();
  });

  it('stop() does not throw', () => {
    const win = new Window();
    expect(() => win.stop()).not.toThrow();
  });

  // ── Dialog stubs ────────────────────────────────────────────────

  it('alert() does not throw', () => {
    const win = new Window();
    expect(() => win.alert('test')).not.toThrow();
  });

  it('confirm() returns false', () => {
    const win = new Window();
    expect(win.confirm('are you sure?')).toBe(false);
  });

  it('prompt() returns null', () => {
    const win = new Window();
    expect(win.prompt('enter value')).toBeNull();
  });

  // ── performance ─────────────────────────────────────────────────

  it('performance.now() returns a number', () => {
    const win = new Window();
    const now = win.performance.now();
    expect(typeof now).toBe('number');
    expect(now).toBeGreaterThan(0);
  });

  // ── customElements ──────────────────────────────────────────────

  it('customElements.define is callable', () => {
    const win = new Window();
    expect(() => win.customElements.define('my-element', class {})).not.toThrow();
  });

  it('customElements.get returns undefined', () => {
    const win = new Window();
    expect(win.customElements.get('my-element')).toBeUndefined();
  });

  it('customElements.whenDefined returns a resolved promise', async () => {
    const win = new Window();
    await expect(win.customElements.whenDefined('my-element')).resolves.toBeUndefined();
  });

  // ── queueMicrotask ──────────────────────────────────────────────

  it('queueMicrotask schedules a microtask', async () => {
    const win = new Window();
    let executed = false;
    win.queueMicrotask(() => {
      executed = true;
    });
    // Microtask should complete before the next event loop tick
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(executed).toBe(true);
  });

  // ── structuredClone ─────────────────────────────────────────────

  it('structuredClone creates a deep copy', () => {
    const win = new Window();
    const original = { a: 1, b: { c: 2 } };
    const clone = win.structuredClone(original);
    expect(clone).toEqual(original);
    expect(clone).not.toBe(original);
    expect(clone.b).not.toBe(original.b);
    // Modify clone to verify independence
    clone.b.c = 99;
    expect(original.b.c).toBe(2);
  });

  // ── EventTarget inheritance ─────────────────────────────────────

  it('supports addEventListener and dispatchEvent', () => {
    const win = new Window();
    let received = false;
    win.addEventListener('custom', (() => {
      received = true;
    }) as any);

    win.dispatchEvent(new Event('custom'));
    expect(received).toBe(true);
  });

  it('supports removeEventListener', () => {
    const win = new Window();
    let count = 0;
    const handler = (() => {
      count++;
    }) as any;
    win.addEventListener('test', handler);
    win.removeEventListener('test', handler);

    win.dispatchEvent(new Event('test'));
    expect(count).toBe(0);
  });

  it('supports once listeners', () => {
    const win = new Window();
    let count = 0;
    win.addEventListener('fire', (() => {
      count++;
    }) as any, { once: true });

    win.dispatchEvent(new Event('fire'));
    win.dispatchEvent(new Event('fire'));
    expect(count).toBe(1);
  });

  // ── History integration ─────────────────────────────────────────

  it('history is wired to dispatch popstate on this window', () => {
    const win = new Window();
    win.history.pushState({ page: 1 }, '', '/p1');
    win.history.pushState({ page: 2 }, '', '/p2');

    const states: unknown[] = [];
    win.addEventListener('popstate', ((e: any) => {
      states.push(e.state);
    }) as any);

    win.history.back();
    expect(states).toEqual([{ page: 1 }]);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Barrel export
// ═══════════════════════════════════════════════════════════════════

describe('Browser barrel export', () => {
  it('exports all classes from index', async () => {
    const mod = await import('../src/browser/index');
    expect(mod.Window).toBe(Window);
    expect(mod.Location).toBe(Location);
    expect(mod.History).toBe(History);
    expect(mod.Navigator).toBe(Navigator);
    expect(mod.Screen).toBe(Screen);
  });
});
