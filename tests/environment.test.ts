import { describe, it, expect, afterEach } from 'vitest';
import { createDixieEnvironment } from '../src/environment/DixieEnvironment';
import { Document } from '../src/nodes/Document';
import { Window } from '../src/browser/Window';
import { TimerController } from '../src/browser/Timers';
import { Event } from '../src/events/Event';
import { CustomEvent } from '../src/events/CustomEvent';
import { MouseEvent } from '../src/events/MouseEvent';
import { KeyboardEvent } from '../src/events/KeyboardEvent';
import { MutationObserver } from '../src/observers/MutationObserver';
import { ResizeObserver } from '../src/observers/ResizeObserver';
import { IntersectionObserver } from '../src/observers/IntersectionObserver';

// ── Helpers ──────────────────────────────────────────────────────────────

// We use a custom target object for installGlobals tests so we don't
// pollute the real globalThis and cause cross-test interference.
function makeTarget(): Record<string, unknown> {
  return {};
}

// ── Tests ────────────────────────────────────────────────────────────────

describe('createDixieEnvironment', () => {
  // Track environments for cleanup
  const envs: ReturnType<typeof createDixieEnvironment>[] = [];

  function createEnv(...args: Parameters<typeof createDixieEnvironment>) {
    const env = createDixieEnvironment(...args);
    envs.push(env);
    return env;
  }

  afterEach(() => {
    for (const env of envs) {
      try {
        env.destroy();
      } catch {
        // already destroyed
      }
    }
    envs.length = 0;
  });

  // ── Construction with defaults ──────────────────────────────────────

  describe('construction with defaults', () => {
    it('creates an environment with default URL', () => {
      const env = createEnv();
      expect(env.location.href).toBe('http://localhost/');
    });

    it('creates an environment with default viewport dimensions', () => {
      const env = createEnv();
      expect(env.window.innerWidth).toBe(1024);
      expect(env.window.innerHeight).toBe(768);
    });

    it('creates a Document instance', () => {
      const env = createEnv();
      expect(env.document).toBeInstanceOf(Document);
    });

    it('creates a Window instance', () => {
      const env = createEnv();
      expect(env.window).toBeInstanceOf(Window);
    });

    it('creates a TimerController instance', () => {
      const env = createEnv();
      expect(env.timers).toBeInstanceOf(TimerController);
    });

    it('has default Dixie user agent', () => {
      const env = createEnv();
      expect(env.navigator.userAgent).toBe('Dixie/0.1.0');
    });
  });

  // ── Construction with custom options ────────────────────────────────

  describe('construction with custom options', () => {
    it('sets custom URL', () => {
      const env = createEnv({ url: 'https://example.com/dashboard?tab=settings' });
      expect(env.location.href).toBe('https://example.com/dashboard?tab=settings');
      expect(env.location.pathname).toBe('/dashboard');
      expect(env.location.search).toBe('?tab=settings');
    });

    it('sets custom viewport width and height', () => {
      const env = createEnv({ width: 1920, height: 1080 });
      expect(env.window.innerWidth).toBe(1920);
      expect(env.window.innerHeight).toBe(1080);
    });

    it('sets custom user agent', () => {
      const env = createEnv({ userAgent: 'TestBot/2.0' });
      expect(env.navigator.userAgent).toBe('TestBot/2.0');
    });

    it('allows all options together', () => {
      const env = createEnv({
        url: 'https://app.test/login',
        width: 375,
        height: 812,
        userAgent: 'MobileTest/1.0',
      });
      expect(env.location.href).toBe('https://app.test/login');
      expect(env.window.innerWidth).toBe(375);
      expect(env.window.innerHeight).toBe(812);
      expect(env.navigator.userAgent).toBe('MobileTest/1.0');
    });
  });

  // ── All properties accessible ───────────────────────────────────────

  describe('all properties are accessible', () => {
    it('exposes window', () => {
      const env = createEnv();
      expect(env.window).toBeDefined();
    });

    it('exposes document', () => {
      const env = createEnv();
      expect(env.document).toBeDefined();
    });

    it('exposes navigator', () => {
      const env = createEnv();
      expect(env.navigator).toBeDefined();
      expect(env.navigator.language).toBe('en-US');
    });

    it('exposes location', () => {
      const env = createEnv();
      expect(env.location).toBeDefined();
      expect(env.location.protocol).toBe('http:');
    });

    it('exposes history', () => {
      const env = createEnv();
      expect(env.history).toBeDefined();
      expect(env.history.length).toBe(1);
    });

    it('exposes screen', () => {
      const env = createEnv();
      expect(env.screen).toBeDefined();
      expect(env.screen.width).toBe(1920);
    });

    it('exposes localStorage', () => {
      const env = createEnv();
      expect(env.localStorage).toBeDefined();
      expect(env.localStorage.length).toBe(0);
    });

    it('exposes sessionStorage', () => {
      const env = createEnv();
      expect(env.sessionStorage).toBeDefined();
      expect(env.sessionStorage.length).toBe(0);
    });

    it('exposes timers', () => {
      const env = createEnv();
      expect(env.timers).toBeDefined();
      expect(typeof env.timers.setTimeout).toBe('function');
    });
  });

  // ── Cross-references ────────────────────────────────────────────────

  describe('cross-references are wired', () => {
    it('window.document points to the document', () => {
      const env = createEnv();
      expect(env.window.document).toBe(env.document);
    });

    it('navigator is the window navigator', () => {
      const env = createEnv();
      expect(env.navigator).toBe(env.window.navigator);
    });

    it('location is the window location', () => {
      const env = createEnv();
      expect(env.location).toBe(env.window.location);
    });

    it('history is the window history', () => {
      const env = createEnv();
      expect(env.history).toBe(env.window.history);
    });

    it('screen is the window screen', () => {
      const env = createEnv();
      expect(env.screen).toBe(env.window.screen);
    });
  });

  // ── Document functionality ──────────────────────────────────────────

  describe('document functionality', () => {
    it('document has a body element', () => {
      const env = createEnv();
      expect(env.document.body).toBeDefined();
      expect(env.document.body.tagName).toBe('BODY');
    });

    it('document has a head element', () => {
      const env = createEnv();
      expect(env.document.head).toBeDefined();
      expect(env.document.head.tagName).toBe('HEAD');
    });

    it('document.createElement creates elements', () => {
      const env = createEnv();
      const div = env.document.createElement('div');
      expect(div.tagName).toBe('DIV');
    });

    it('can append elements to body', () => {
      const env = createEnv();
      const div = env.document.createElement('div');
      div.id = 'test';
      env.document.body.appendChild(div);
      const found = env.document.getElementById('test');
      expect(found).not.toBeNull();
      expect(found!.id).toBe('test');
    });

    it('can set and read document title', () => {
      const env = createEnv();
      env.document.title = 'Test Page';
      expect(env.document.title).toBe('Test Page');
    });
  });

  // ── Storage functionality ───────────────────────────────────────────

  describe('storage functionality', () => {
    it('localStorage stores and retrieves items', () => {
      const env = createEnv();
      env.localStorage.setItem('key', 'value');
      expect(env.localStorage.getItem('key')).toBe('value');
    });

    it('sessionStorage stores and retrieves items', () => {
      const env = createEnv();
      env.sessionStorage.setItem('session-key', 'session-value');
      expect(env.sessionStorage.getItem('session-key')).toBe('session-value');
    });

    it('localStorage and sessionStorage are independent', () => {
      const env = createEnv();
      env.localStorage.setItem('shared-key', 'local');
      env.sessionStorage.setItem('shared-key', 'session');
      expect(env.localStorage.getItem('shared-key')).toBe('local');
      expect(env.sessionStorage.getItem('shared-key')).toBe('session');
    });

    it('storage supports bracket notation', () => {
      const env = createEnv();
      (env.localStorage as any)['bracket-key'] = 'bracket-value';
      expect(env.localStorage.getItem('bracket-key')).toBe('bracket-value');
    });
  });

  // ── Timer functionality ─────────────────────────────────────────────

  describe('timer functionality', () => {
    it('timers work in fake mode', () => {
      const env = createEnv();
      env.timers.useFakeTimers();

      let called = false;
      env.timers.setTimeout(() => { called = true; }, 100);
      expect(called).toBe(false);

      env.timers.tick(100);
      expect(called).toBe(true);
    });

    it('timers can set and clear intervals', () => {
      const env = createEnv();
      env.timers.useFakeTimers();

      let count = 0;
      const id = env.timers.setInterval(() => { count++; }, 50);

      env.timers.tick(150);
      expect(count).toBe(3);

      env.timers.clearInterval(id);
      env.timers.tick(100);
      expect(count).toBe(3);
    });

    it('requestAnimationFrame works in fake mode', () => {
      const env = createEnv();
      env.timers.useFakeTimers();

      let timestamp: number | null = null;
      env.timers.requestAnimationFrame((t) => { timestamp = t; });

      env.timers.tick(16);
      expect(timestamp).not.toBeNull();
    });
  });

  // ── reset() ─────────────────────────────────────────────────────────

  describe('reset()', () => {
    it('clears document body children', () => {
      const env = createEnv();
      const div = env.document.createElement('div');
      env.document.body.appendChild(div);
      expect(env.document.body.childNodes.length).toBeGreaterThan(0);

      env.reset();
      expect(env.document.body.childNodes.length).toBe(0);
    });

    it('clears document head children', () => {
      const env = createEnv();
      const style = env.document.createElement('style');
      env.document.head.appendChild(style);
      expect(env.document.head.childNodes.length).toBeGreaterThan(0);

      env.reset();
      expect(env.document.head.childNodes.length).toBe(0);
    });

    it('clears localStorage', () => {
      const env = createEnv();
      env.localStorage.setItem('persist', 'no');
      expect(env.localStorage.length).toBe(1);

      env.reset();
      expect(env.localStorage.length).toBe(0);
    });

    it('clears sessionStorage', () => {
      const env = createEnv();
      env.sessionStorage.setItem('temp', 'gone');
      expect(env.sessionStorage.length).toBe(1);

      env.reset();
      expect(env.sessionStorage.length).toBe(0);
    });

    it('resets timers', () => {
      const env = createEnv();
      env.timers.useFakeTimers();
      env.timers.setTimeout(() => {}, 1000);
      expect(env.timers.getTimerCount()).toBe(1);

      env.reset();
      expect(env.timers.getTimerCount()).toBe(0);
    });

    it('resets window scroll position', () => {
      const env = createEnv();
      env.window.scrollTo(100, 200);
      expect(env.window.scrollX).toBe(100);
      expect(env.window.scrollY).toBe(200);

      env.reset();
      expect(env.window.scrollX).toBe(0);
      expect(env.window.scrollY).toBe(0);
    });

    it('keeps the same URL after reset', () => {
      const env = createEnv({ url: 'https://keep.this/path' });
      env.reset();
      expect(env.location.href).toBe('https://keep.this/path');
    });

    it('environment is still usable after reset', () => {
      const env = createEnv();
      env.reset();

      // Can still create elements and use storage
      const el = env.document.createElement('span');
      env.document.body.appendChild(el);
      expect(env.document.body.childNodes.length).toBe(1);

      env.localStorage.setItem('after-reset', 'works');
      expect(env.localStorage.getItem('after-reset')).toBe('works');
    });
  });

  // ── destroy() ───────────────────────────────────────────────────────

  describe('destroy()', () => {
    it('prevents accessing window after destroy', () => {
      const env = createDixieEnvironment();
      env.destroy();
      expect(() => env.window).toThrow('destroyed');
    });

    it('prevents accessing document after destroy', () => {
      const env = createDixieEnvironment();
      env.destroy();
      expect(() => env.document).toThrow('destroyed');
    });

    it('prevents accessing navigator after destroy', () => {
      const env = createDixieEnvironment();
      env.destroy();
      expect(() => env.navigator).toThrow('destroyed');
    });

    it('prevents accessing localStorage after destroy', () => {
      const env = createDixieEnvironment();
      env.destroy();
      expect(() => env.localStorage).toThrow('destroyed');
    });

    it('prevents accessing timers after destroy', () => {
      const env = createDixieEnvironment();
      env.destroy();
      expect(() => env.timers).toThrow('destroyed');
    });

    it('prevents calling reset after destroy', () => {
      const env = createDixieEnvironment();
      env.destroy();
      expect(() => env.reset()).toThrow('destroyed');
    });

    it('prevents calling destroy twice', () => {
      const env = createDixieEnvironment();
      env.destroy();
      expect(() => env.destroy()).toThrow('destroyed');
    });

    it('prevents calling installGlobals after destroy', () => {
      const env = createDixieEnvironment();
      env.destroy();
      expect(() => env.installGlobals(makeTarget())).toThrow('destroyed');
    });
  });

  // ── installGlobals / uninstallGlobals ───────────────────────────────

  describe('installGlobals / uninstallGlobals', () => {
    it('installs window on target', () => {
      const env = createEnv();
      const target = makeTarget();
      env.installGlobals(target);

      expect(target['window']).toBe(env.window);
    });

    it('installs document on target', () => {
      const env = createEnv();
      const target = makeTarget();
      env.installGlobals(target);

      expect(target['document']).toBe(env.document);
    });

    it('installs navigator on target', () => {
      const env = createEnv();
      const target = makeTarget();
      env.installGlobals(target);

      expect(target['navigator']).toBe(env.navigator);
    });

    it('installs location on target', () => {
      const env = createEnv();
      const target = makeTarget();
      env.installGlobals(target);

      expect(target['location']).toBe(env.location);
    });

    it('installs localStorage and sessionStorage on target', () => {
      const env = createEnv();
      const target = makeTarget();
      env.installGlobals(target);

      expect(target['localStorage']).toBe(env.localStorage);
      expect(target['sessionStorage']).toBe(env.sessionStorage);
    });

    it('installs timer functions on target', () => {
      const env = createEnv();
      const target = makeTarget();
      env.installGlobals(target);

      expect(typeof target['setTimeout']).toBe('function');
      expect(typeof target['clearTimeout']).toBe('function');
      expect(typeof target['setInterval']).toBe('function');
      expect(typeof target['clearInterval']).toBe('function');
      expect(typeof target['requestAnimationFrame']).toBe('function');
      expect(typeof target['cancelAnimationFrame']).toBe('function');
    });

    it('installs event classes on target', () => {
      const env = createEnv();
      const target = makeTarget();
      env.installGlobals(target);

      expect(target['Event']).toBe(Event);
      expect(target['CustomEvent']).toBe(CustomEvent);
      expect(target['MouseEvent']).toBe(MouseEvent);
      expect(target['KeyboardEvent']).toBe(KeyboardEvent);
    });

    it('installs observer classes on target', () => {
      const env = createEnv();
      const target = makeTarget();
      env.installGlobals(target);

      expect(target['MutationObserver']).toBe(MutationObserver);
      expect(target['ResizeObserver']).toBe(ResizeObserver);
      expect(target['IntersectionObserver']).toBe(IntersectionObserver);
    });

    it('uninstallGlobals restores original values', () => {
      const env = createEnv();
      const target = makeTarget();
      target['window'] = 'original-window';
      target['document'] = 'original-document';

      env.installGlobals(target);
      expect(target['window']).toBe(env.window);

      env.uninstallGlobals(target);
      expect(target['window']).toBe('original-window');
      expect(target['document']).toBe('original-document');
    });

    it('uninstallGlobals deletes properties that did not exist before', () => {
      const env = createEnv();
      const target = makeTarget();
      // target has no 'MutationObserver' property initially

      env.installGlobals(target);
      expect(target['MutationObserver']).toBe(MutationObserver);

      env.uninstallGlobals(target);
      expect('MutationObserver' in target).toBe(false);
    });

    it('installGlobals/uninstallGlobals round-trip preserves target state', () => {
      const env = createEnv();
      const target: Record<string, unknown> = {
        existingProp: 42,
        setTimeout: 'my-timeout',
      };

      env.installGlobals(target);
      env.uninstallGlobals(target);

      expect(target['existingProp']).toBe(42);
      expect(target['setTimeout']).toBe('my-timeout');
      expect('window' in target).toBe(false);
      expect('document' in target).toBe(false);
    });

    it('installed timer functions are bound to the timers instance', () => {
      const env = createEnv();
      const target = makeTarget();
      env.installGlobals(target);
      env.timers.useFakeTimers();

      let called = false;
      const setTimeoutFn = target['setTimeout'] as (cb: () => void, ms: number) => number;
      setTimeoutFn(() => { called = true; }, 50);

      env.timers.tick(50);
      expect(called).toBe(true);
    });

    it('uninstallGlobals is a no-op if installGlobals was never called on that target', () => {
      const env = createEnv();
      const target = makeTarget();
      target['window'] = 'keep-me';

      // uninstall without install — should not touch target
      env.uninstallGlobals(target);
      expect(target['window']).toBe('keep-me');
    });
  });

  // ── Environment isolation ──────────────────────────────────────────

  describe('environment isolation', () => {
    it('two environments have independent documents', () => {
      const env1 = createEnv();
      const env2 = createEnv();

      const div1 = env1.document.createElement('div');
      div1.id = 'env1-div';
      env1.document.body.appendChild(div1);

      expect(env1.document.getElementById('env1-div')).not.toBeNull();
      expect(env2.document.getElementById('env1-div')).toBeNull();
    });

    it('two environments have independent storage', () => {
      const env1 = createEnv();
      const env2 = createEnv();

      env1.localStorage.setItem('env', '1');
      env2.localStorage.setItem('env', '2');

      expect(env1.localStorage.getItem('env')).toBe('1');
      expect(env2.localStorage.getItem('env')).toBe('2');
    });

    it('two environments have independent timers', () => {
      const env1 = createEnv();
      const env2 = createEnv();

      env1.timers.useFakeTimers();
      env2.timers.useFakeTimers();

      let count1 = 0;
      let count2 = 0;
      env1.timers.setTimeout(() => { count1++; }, 100);
      env2.timers.setTimeout(() => { count2++; }, 100);

      env1.timers.tick(100);
      expect(count1).toBe(1);
      expect(count2).toBe(0);

      env2.timers.tick(100);
      expect(count2).toBe(1);
    });

    it('two environments have independent windows', () => {
      const env1 = createEnv({ url: 'http://first.com/' });
      const env2 = createEnv({ url: 'http://second.com/' });

      expect(env1.location.hostname).toBe('first.com');
      expect(env2.location.hostname).toBe('second.com');
    });

    it('resetting one environment does not affect another', () => {
      const env1 = createEnv();
      const env2 = createEnv();

      env1.localStorage.setItem('data', 'keep');
      env2.localStorage.setItem('data', 'also-keep');

      env1.reset();
      expect(env1.localStorage.getItem('data')).toBeNull();
      expect(env2.localStorage.getItem('data')).toBe('also-keep');
    });

    it('installGlobals on different targets from different environments', () => {
      const env1 = createEnv({ url: 'http://one.com/' });
      const env2 = createEnv({ url: 'http://two.com/' });

      const target1 = makeTarget();
      const target2 = makeTarget();

      env1.installGlobals(target1);
      env2.installGlobals(target2);

      expect((target1['location'] as any).hostname).toBe('one.com');
      expect((target2['location'] as any).hostname).toBe('two.com');

      env1.uninstallGlobals(target1);
      env2.uninstallGlobals(target2);
    });
  });

  // ── Window features through environment ─────────────────────────────

  describe('window features through environment', () => {
    it('window.scrollTo works', () => {
      const env = createEnv();
      env.window.scrollTo(50, 100);
      expect(env.window.scrollX).toBe(50);
      expect(env.window.scrollY).toBe(100);
    });

    it('window.matchMedia returns a stub', () => {
      const env = createEnv();
      const mql = env.window.matchMedia('(max-width: 768px)');
      expect(mql.media).toBe('(max-width: 768px)');
      expect(mql.matches).toBe(false);
    });

    it('window.getComputedStyle returns empty strings', () => {
      const env = createEnv();
      const el = env.document.createElement('div');
      const style = env.window.getComputedStyle(el);
      expect(style['color']).toBe('');
    });

    it('window.atob/btoa work', () => {
      const env = createEnv();
      const encoded = env.window.btoa('hello');
      expect(env.window.atob(encoded)).toBe('hello');
    });

    it('window.history supports pushState', () => {
      const env = createEnv();
      env.history.pushState({ page: 1 }, '', '/page1');
      expect(env.history.length).toBe(2);
      expect(env.history.state).toEqual({ page: 1 });
    });
  });

  // ── Edge cases ──────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('createDixieEnvironment with no arguments works', () => {
      const env = createEnv();
      expect(env.window).toBeInstanceOf(Window);
      expect(env.document).toBeInstanceOf(Document);
    });

    it('createDixieEnvironment with empty options works', () => {
      const env = createEnv({});
      expect(env.location.href).toBe('http://localhost/');
    });

    it('multiple resets in a row do not throw', () => {
      const env = createEnv();
      env.reset();
      env.reset();
      env.reset();
      // No error thrown
      expect(env.document.body.childNodes.length).toBe(0);
    });

    it('reset after adding many elements clears all', () => {
      const env = createEnv();
      for (let i = 0; i < 50; i++) {
        const el = env.document.createElement('div');
        el.id = `el-${i}`;
        env.document.body.appendChild(el);
      }
      expect(env.document.body.childNodes.length).toBe(50);

      env.reset();
      expect(env.document.body.childNodes.length).toBe(0);
    });
  });
});
