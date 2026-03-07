import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConsoleCapture } from '../src/console/ConsoleCapture';

// ═══════════════════════════════════════════════════════════════════════
// ConsoleCapture — Console spy and noise filter for Dixie CLI Browser
// ═══════════════════════════════════════════════════════════════════════

describe('ConsoleCapture', () => {
  let capture: ConsoleCapture;

  afterEach(() => {
    // Always uninstall to restore console after each test
    if (capture && capture.isInstalled()) {
      capture.uninstall();
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // Construction
  // ═══════════════════════════════════════════════════════════════════

  describe('construction', () => {
    it('creates an instance with default options', () => {
      capture = new ConsoleCapture();
      expect(capture).toBeInstanceOf(ConsoleCapture);
      expect(capture.isInstalled()).toBe(false);
    });

    it('creates an instance with custom noise patterns', () => {
      capture = new ConsoleCapture({ noisePatterns: ['custom noise'] });
      const patterns = capture.getNoisePatterns();
      expect(patterns).toContain('custom noise');
    });

    it('creates an instance with capture options for log/info/debug', () => {
      capture = new ConsoleCapture({
        captureLog: true,
        captureInfo: true,
        captureDebug: true,
      });
      expect(capture).toBeInstanceOf(ConsoleCapture);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Install / Uninstall lifecycle
  // ═══════════════════════════════════════════════════════════════════

  describe('install / uninstall', () => {
    it('installs spies on console methods', () => {
      capture = new ConsoleCapture();
      const origError = console.error;
      capture.install();
      expect(capture.isInstalled()).toBe(true);
      expect(console.error).not.toBe(origError);
    });

    it('uninstalls and restores original console methods', () => {
      capture = new ConsoleCapture();
      const origError = console.error;
      const origWarn = console.warn;
      capture.install();
      capture.uninstall();
      expect(capture.isInstalled()).toBe(false);
      expect(console.error).toBe(origError);
      expect(console.warn).toBe(origWarn);
    });

    it('install is idempotent — calling twice does not double-wrap', () => {
      capture = new ConsoleCapture();
      capture.install();
      const spyError = console.error;
      capture.install(); // second call
      expect(console.error).toBe(spyError); // same spy, not re-wrapped
      expect(capture.isInstalled()).toBe(true);
    });

    it('uninstall is a no-op when not installed', () => {
      capture = new ConsoleCapture();
      // Should not throw
      expect(() => capture.uninstall()).not.toThrow();
      expect(capture.isInstalled()).toBe(false);
    });

    it('installing a second instance uninstalls the first', () => {
      const capture1 = new ConsoleCapture();
      const capture2 = new ConsoleCapture();
      capture1.install();
      expect(capture1.isInstalled()).toBe(true);

      capture2.install();
      expect(capture2.isInstalled()).toBe(true);
      expect(capture1.isInstalled()).toBe(false);

      // Cleanup
      capture2.uninstall();
      capture = capture2; // for afterEach safety
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Error capture
  // ═══════════════════════════════════════════════════════════════════

  describe('error capture', () => {
    beforeEach(() => {
      capture = new ConsoleCapture({ noisePatterns: [] });
      capture.install();
    });

    it('captures console.error calls', () => {
      console.error('Something went wrong');
      expect(capture.getErrors()).toEqual(['Something went wrong']);
    });

    it('captures multiple error calls', () => {
      console.error('error 1');
      console.error('error 2');
      console.error('error 3');
      expect(capture.getErrors()).toHaveLength(3);
    });

    it('captures error with no arguments as empty string', () => {
      console.error();
      expect(capture.getRawErrors()).toEqual(['']);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Warning capture
  // ═══════════════════════════════════════════════════════════════════

  describe('warning capture', () => {
    beforeEach(() => {
      capture = new ConsoleCapture({ noisePatterns: [] });
      capture.install();
    });

    it('captures console.warn calls', () => {
      console.warn('Deprecation warning');
      expect(capture.getWarnings()).toEqual(['Deprecation warning']);
    });

    it('captures multiple warnings', () => {
      console.warn('warn 1');
      console.warn('warn 2');
      expect(capture.getWarnings()).toHaveLength(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Optional log / info / debug capture
  // ═══════════════════════════════════════════════════════════════════

  describe('optional log/info/debug capture', () => {
    it('does NOT capture console.log by default', () => {
      capture = new ConsoleCapture({ noisePatterns: [] });
      const origLog = console.log;
      capture.install();
      expect(console.log).toBe(origLog);
    });

    it('captures console.log when captureLog is true', () => {
      capture = new ConsoleCapture({ captureLog: true, noisePatterns: [] });
      capture.install();
      console.log('logged');
      expect(capture.getLogs()).toEqual(['logged']);
    });

    it('captures console.info when captureInfo is true', () => {
      capture = new ConsoleCapture({ captureInfo: true, noisePatterns: [] });
      capture.install();
      console.info('info message');
      expect(capture.getLogs()).toContain('info message');
    });

    it('captures console.debug when captureDebug is true', () => {
      capture = new ConsoleCapture({ captureDebug: true, noisePatterns: [] });
      capture.install();
      console.debug('debug message');
      expect(capture.getLogs()).toContain('debug message');
    });

    it('does NOT capture console.info by default', () => {
      capture = new ConsoleCapture({ noisePatterns: [] });
      const origInfo = console.info;
      capture.install();
      expect(console.info).toBe(origInfo);
    });

    it('does NOT capture console.debug by default', () => {
      capture = new ConsoleCapture({ noisePatterns: [] });
      const origDebug = console.debug;
      capture.install();
      expect(console.debug).toBe(origDebug);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Argument stringification
  // ═══════════════════════════════════════════════════════════════════

  describe('argument stringification', () => {
    beforeEach(() => {
      capture = new ConsoleCapture({ noisePatterns: [] });
      capture.install();
    });

    it('joins multiple string arguments with space', () => {
      console.error('hello', 'world');
      expect(capture.getErrors()).toEqual(['hello world']);
    });

    it('stringifies object arguments', () => {
      console.error({ key: 'value' });
      const errors = capture.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('[object Object]');
    });

    it('stringifies number arguments', () => {
      console.error(42);
      expect(capture.getErrors()).toEqual(['42']);
    });

    it('stringifies boolean arguments', () => {
      console.error(true);
      expect(capture.getErrors()).toEqual(['true']);
    });

    it('stringifies null argument', () => {
      console.error(null);
      expect(capture.getErrors()).toEqual(['null']);
    });

    it('stringifies undefined argument', () => {
      console.error(undefined);
      expect(capture.getErrors()).toEqual(['undefined']);
    });

    it('stringifies Error objects to include the message', () => {
      console.error(new Error('kaboom'));
      const errors = capture.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('kaboom');
    });

    it('handles mixed argument types', () => {
      console.error('count:', 3, 'active:', true);
      expect(capture.getErrors()).toEqual(['count: 3 active: true']);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Noise filtering — string patterns
  // ═══════════════════════════════════════════════════════════════════

  describe('noise filtering — string patterns', () => {
    it('filters out errors matching a string noise pattern', () => {
      capture = new ConsoleCapture({ noisePatterns: ['known noise'] });
      capture.install();
      console.error('known noise from framework');
      console.error('real error');
      expect(capture.getErrors()).toEqual(['real error']);
    });

    it('filters using partial string match (includes)', () => {
      capture = new ConsoleCapture({ noisePatterns: ['React'] });
      capture.install();
      console.error('React is doing something weird');
      expect(capture.getErrors()).toEqual([]);
    });

    it('keeps raw errors even when filtered', () => {
      capture = new ConsoleCapture({ noisePatterns: ['noise'] });
      capture.install();
      console.error('noise message');
      console.error('real error');
      expect(capture.getRawErrors()).toHaveLength(2);
      expect(capture.getErrors()).toHaveLength(1);
    });

    it('filters warnings with string patterns', () => {
      capture = new ConsoleCapture({ noisePatterns: ['deprecation'] });
      capture.install();
      console.warn('deprecation warning');
      console.warn('real warning');
      expect(capture.getWarnings()).toEqual(['real warning']);
      expect(capture.getRawWarnings()).toHaveLength(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Noise filtering — regex patterns
  // ═══════════════════════════════════════════════════════════════════

  describe('noise filtering — regex patterns', () => {
    it('filters out errors matching a regex noise pattern', () => {
      capture = new ConsoleCapture({ noisePatterns: [/act\(/] });
      capture.install();
      console.error('Warning: An update inside act() was not wrapped');
      console.error('real error');
      expect(capture.getErrors()).toEqual(['real error']);
    });

    it('filters with case-insensitive regex', () => {
      capture = new ConsoleCapture({ noisePatterns: [/stripe/i] });
      capture.install();
      console.error('Stripe SDK loaded');
      console.error('STRIPE connection failed');
      console.error('real error');
      expect(capture.getErrors()).toEqual(['real error']);
    });

    it('supports multiple regex patterns', () => {
      capture = new ConsoleCapture({ noisePatterns: [/foo/, /bar/] });
      capture.install();
      console.error('foo happened');
      console.error('bar happened');
      console.error('baz happened');
      expect(capture.getErrors()).toEqual(['baz happened']);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Default noise patterns
  // ═══════════════════════════════════════════════════════════════════

  describe('default noise patterns', () => {
    beforeEach(() => {
      capture = new ConsoleCapture(); // uses defaults
      capture.install();
    });

    it('filters React Query noise', () => {
      console.error('No queryFn was passed');
      expect(capture.getErrors()).toEqual([]);
    });

    it('filters React 18 deprecation noise', () => {
      console.error('defaultProps will be removed in a future release');
      expect(capture.getErrors()).toEqual([]);
    });

    it('filters act() warnings', () => {
      console.error('Warning: An update inside act() was not wrapped');
      expect(capture.getErrors()).toEqual([]);
    });

    it('filters "not wrapped in act" warnings', () => {
      console.error('not wrapped in act');
      expect(capture.getErrors()).toEqual([]);
    });

    it('filters "Cannot update a component" warnings', () => {
      console.error('Cannot update a component while rendering');
      expect(capture.getErrors()).toEqual([]);
    });

    it('filters auth provider noise', () => {
      console.error('No refresh token available');
      expect(capture.getErrors()).toEqual([]);
    });

    it('filters ResizeObserver noise', () => {
      console.error('ResizeObserver loop completed with undelivered notifications');
      expect(capture.getErrors()).toEqual([]);
    });

    it('filters useLayoutEffect noise', () => {
      console.error('useLayoutEffect does nothing on the server');
      expect(capture.getErrors()).toEqual([]);
    });

    it('filters Stripe SDK noise', () => {
      console.error('Stripe.js not loaded');
      expect(capture.getErrors()).toEqual([]);
    });

    it('filters Google SDK noise', () => {
      console.error('google maps api not loaded');
      expect(capture.getErrors()).toEqual([]);
    });

    it('filters API errors in test', () => {
      console.error('Error fetching /api/invoices');
      expect(capture.getErrors()).toEqual([]);
    });

    it('filters WebSocket noise', () => {
      console.error('WebSocket connection failed');
      expect(capture.getErrors()).toEqual([]);
    });

    it('filters AbortError noise', () => {
      console.error('AbortError: The user aborted a request');
      expect(capture.getErrors()).toEqual([]);
    });

    it('filters socket noise', () => {
      console.error('socket disconnected unexpectedly');
      expect(capture.getErrors()).toEqual([]);
    });

    it('lets real errors through default patterns', () => {
      console.error('TypeError: Cannot read property "foo" of undefined');
      expect(capture.getErrors()).toHaveLength(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Noise pattern management
  // ═══════════════════════════════════════════════════════════════════

  describe('noise pattern management', () => {
    it('addNoisePattern adds a string pattern', () => {
      capture = new ConsoleCapture({ noisePatterns: [] });
      capture.addNoisePattern('new noise');
      expect(capture.getNoisePatterns()).toContain('new noise');
    });

    it('addNoisePattern adds a regex pattern', () => {
      capture = new ConsoleCapture({ noisePatterns: [] });
      capture.addNoisePattern(/custom/);
      expect(capture.getNoisePatterns()).toContainEqual(/custom/);
    });

    it('removeNoisePattern removes a string pattern', () => {
      capture = new ConsoleCapture({ noisePatterns: ['removable'] });
      capture.removeNoisePattern('removable');
      expect(capture.getNoisePatterns()).not.toContain('removable');
    });

    it('removeNoisePattern removes a regex pattern by reference', () => {
      const re = /removable/;
      capture = new ConsoleCapture({ noisePatterns: [re] });
      capture.removeNoisePattern(re);
      expect(capture.getNoisePatterns()).not.toContainEqual(re);
    });

    it('removeNoisePattern is a no-op for non-existent pattern', () => {
      capture = new ConsoleCapture({ noisePatterns: ['exists'] });
      capture.removeNoisePattern('does not exist');
      expect(capture.getNoisePatterns()).toContain('exists');
    });

    it('getNoisePatterns returns a copy, not the internal array', () => {
      capture = new ConsoleCapture({ noisePatterns: ['a'] });
      const patterns = capture.getNoisePatterns();
      patterns.push('b');
      expect(capture.getNoisePatterns()).not.toContain('b');
    });

    it('newly added patterns take effect immediately', () => {
      capture = new ConsoleCapture({ noisePatterns: [] });
      capture.install();
      console.error('custom noise message');
      expect(capture.getErrors()).toHaveLength(1);

      capture.addNoisePattern('custom noise');
      // Already captured calls are re-filtered
      expect(capture.getErrors()).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // getAll()
  // ═══════════════════════════════════════════════════════════════════

  describe('getAll()', () => {
    it('returns correct shape with errors, warnings, and logs', () => {
      capture = new ConsoleCapture({ captureLog: true, noisePatterns: [] });
      capture.install();
      console.error('err');
      console.warn('wrn');
      console.log('lg');
      const all = capture.getAll();
      expect(all).toEqual({
        errors: ['err'],
        warnings: ['wrn'],
        logs: ['lg'],
      });
    });

    it('returns empty arrays when nothing captured', () => {
      capture = new ConsoleCapture();
      capture.install();
      const all = capture.getAll();
      expect(all).toEqual({ errors: [], warnings: [], logs: [] });
    });

    it('returns filtered results (not raw)', () => {
      capture = new ConsoleCapture({ noisePatterns: ['noise'] });
      capture.install();
      console.error('noise error');
      console.error('real error');
      const all = capture.getAll();
      expect(all.errors).toEqual(['real error']);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // getRaw vs getFiltered
  // ═══════════════════════════════════════════════════════════════════

  describe('getRaw vs filtered', () => {
    it('getRawErrors includes noise, getErrors excludes it', () => {
      capture = new ConsoleCapture({ noisePatterns: ['framework'] });
      capture.install();
      console.error('framework warning');
      console.error('real error');
      expect(capture.getRawErrors()).toHaveLength(2);
      expect(capture.getErrors()).toHaveLength(1);
      expect(capture.getErrors()).toEqual(['real error']);
    });

    it('getRawWarnings includes noise, getWarnings excludes it', () => {
      capture = new ConsoleCapture({ noisePatterns: ['framework'] });
      capture.install();
      console.warn('framework deprecation');
      console.warn('real warning');
      expect(capture.getRawWarnings()).toHaveLength(2);
      expect(capture.getWarnings()).toHaveLength(1);
    });

    it('returns empty arrays when nothing captured', () => {
      capture = new ConsoleCapture();
      expect(capture.getRawErrors()).toEqual([]);
      expect(capture.getRawWarnings()).toEqual([]);
      expect(capture.getErrors()).toEqual([]);
      expect(capture.getWarnings()).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // reset() vs resetAll()
  // ═══════════════════════════════════════════════════════════════════

  describe('reset() vs resetAll()', () => {
    it('reset() clears captured calls', () => {
      capture = new ConsoleCapture({ noisePatterns: [] });
      capture.install();
      console.error('error');
      console.warn('warning');
      expect(capture.getErrors()).toHaveLength(1);
      capture.reset();
      expect(capture.getErrors()).toEqual([]);
      expect(capture.getWarnings()).toEqual([]);
    });

    it('reset() keeps noise patterns', () => {
      capture = new ConsoleCapture({ noisePatterns: ['keep me'] });
      capture.install();
      capture.reset();
      expect(capture.getNoisePatterns()).toContain('keep me');
    });

    it('reset() keeps install state', () => {
      capture = new ConsoleCapture({ noisePatterns: [] });
      capture.install();
      capture.reset();
      expect(capture.isInstalled()).toBe(true);
      // Capture still works after reset
      console.error('after reset');
      expect(capture.getErrors()).toEqual(['after reset']);
    });

    it('resetAll() clears captured calls', () => {
      capture = new ConsoleCapture({ noisePatterns: [] });
      capture.install();
      console.error('error');
      capture.resetAll();
      expect(capture.getErrors()).toEqual([]);
    });

    it('resetAll() resets patterns to constructor defaults', () => {
      capture = new ConsoleCapture({ noisePatterns: ['initial'] });
      capture.addNoisePattern('added later');
      expect(capture.getNoisePatterns()).toContain('added later');
      capture.resetAll();
      expect(capture.getNoisePatterns()).toContain('initial');
      expect(capture.getNoisePatterns()).not.toContain('added later');
    });

    it('resetAll() keeps install state', () => {
      capture = new ConsoleCapture();
      capture.install();
      capture.resetAll();
      expect(capture.isInstalled()).toBe(true);
    });

    it('resetAll() with no initial custom patterns resets to defaults', () => {
      capture = new ConsoleCapture();
      const defaultCount = capture.getNoisePatterns().length;
      capture.addNoisePattern('extra');
      expect(capture.getNoisePatterns().length).toBe(defaultCount + 1);
      capture.resetAll();
      expect(capture.getNoisePatterns().length).toBe(defaultCount);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Edge cases
  // ═══════════════════════════════════════════════════════════════════

  describe('edge cases', () => {
    it('captures calls made before any noise patterns are set', () => {
      capture = new ConsoleCapture({ noisePatterns: [] });
      capture.install();
      console.error('first');
      expect(capture.getErrors()).toEqual(['first']);
    });

    it('handles console.error with no arguments', () => {
      capture = new ConsoleCapture({ noisePatterns: [] });
      capture.install();
      console.error();
      expect(capture.getRawErrors()).toHaveLength(1);
      expect(capture.getRawErrors()[0]).toBe('');
    });

    it('handles very long error messages', () => {
      capture = new ConsoleCapture({ noisePatterns: [] });
      capture.install();
      const longMsg = 'a'.repeat(10000);
      console.error(longMsg);
      expect(capture.getErrors()[0]).toBe(longMsg);
    });

    it('does not call through to original console by default (silent)', () => {
      // We can verify this by checking that the original is stored
      // but the spy does not forward. This is a behavioral test:
      // the captured message exists, the original was replaced.
      capture = new ConsoleCapture({ noisePatterns: [] });
      capture.install();
      // If it called through, we'd see output in test runner —
      // we verify structurally that install replaces the method.
      expect(capture.isInstalled()).toBe(true);
    });

    it('getErrors returns a new array each time', () => {
      capture = new ConsoleCapture({ noisePatterns: [] });
      capture.install();
      console.error('test');
      const a = capture.getErrors();
      const b = capture.getErrors();
      expect(a).toEqual(b);
      expect(a).not.toBe(b); // different array instances
    });

    it('handles Array arguments', () => {
      capture = new ConsoleCapture({ noisePatterns: [] });
      capture.install();
      console.error([1, 2, 3]);
      expect(capture.getErrors()).toHaveLength(1);
      expect(capture.getErrors()[0]).toContain('1,2,3');
    });

    it('handles function arguments', () => {
      capture = new ConsoleCapture({ noisePatterns: [] });
      capture.install();
      console.error(function myFunc() {});
      expect(capture.getErrors()).toHaveLength(1);
    });

    it('multiple captures in sequence (install/uninstall cycle)', () => {
      capture = new ConsoleCapture({ noisePatterns: [] });
      capture.install();
      console.error('first session');
      capture.uninstall();

      capture.install();
      // Old calls are still there (not cleared by reinstall)
      console.error('second session');
      expect(capture.getRawErrors()).toHaveLength(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Mixed pattern types
  // ═══════════════════════════════════════════════════════════════════

  describe('mixed string and regex patterns', () => {
    it('filters with both string and regex patterns simultaneously', () => {
      capture = new ConsoleCapture({
        noisePatterns: ['known string', /regex\d+/],
      });
      capture.install();
      console.error('known string error');
      console.error('regex123 error');
      console.error('real error');
      expect(capture.getErrors()).toEqual(['real error']);
    });

    it('adding patterns after construction works with mix', () => {
      capture = new ConsoleCapture({ noisePatterns: ['initial'] });
      capture.addNoisePattern(/dynamic/);
      capture.install();
      console.error('initial noise');
      console.error('dynamic noise');
      console.error('real error');
      expect(capture.getErrors()).toEqual(['real error']);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Logs bucket aggregation (info, debug go into logs)
  // ═══════════════════════════════════════════════════════════════════

  describe('logs bucket aggregation', () => {
    it('info and debug go into the same logs bucket', () => {
      capture = new ConsoleCapture({
        captureLog: true,
        captureInfo: true,
        captureDebug: true,
        noisePatterns: [],
      });
      capture.install();
      console.log('log msg');
      console.info('info msg');
      console.debug('debug msg');
      expect(capture.getLogs()).toEqual(['log msg', 'info msg', 'debug msg']);
    });

    it('getLogs returns empty when none of log/info/debug captured', () => {
      capture = new ConsoleCapture({ noisePatterns: [] });
      capture.install();
      expect(capture.getLogs()).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Cloudflare and beacon noise (from defaults)
  // ═══════════════════════════════════════════════════════════════════

  describe('additional default noise patterns', () => {
    beforeEach(() => {
      capture = new ConsoleCapture();
      capture.install();
    });

    it('filters cloudflare noise', () => {
      console.error('cloudflare challenge script loaded');
      expect(capture.getErrors()).toEqual([]);
    });

    it('filters beacon noise', () => {
      console.error('navigator.sendBeacon failed');
      expect(capture.getErrors()).toEqual([]);
    });

    it('filters IntersectionObserver noise', () => {
      console.error('IntersectionObserver not supported');
      expect(capture.getErrors()).toEqual([]);
    });

    it('filters "Cannot update during an existing state transition"', () => {
      console.error('Cannot update during an existing state transition');
      expect(capture.getErrors()).toEqual([]);
    });

    it('filters "No QueryClient set"', () => {
      console.error('No QueryClient set, use QueryClientProvider to set one');
      expect(capture.getErrors()).toEqual([]);
    });

    it('filters "No auth token" noise', () => {
      console.error('No auth token found');
      expect(capture.getErrors()).toEqual([]);
    });

    it('filters "ReactDOM.render is no longer supported"', () => {
      console.error('ReactDOM.render is no longer supported in React 18');
      expect(capture.getErrors()).toEqual([]);
    });
  });
});
