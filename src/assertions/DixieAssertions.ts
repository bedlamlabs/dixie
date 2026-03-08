/**
 * DixieAssertions — structured assertion helpers for AI agents.
 *
 * Every assertion returns an AssertionResult with a human-readable
 * description and, on failure, actionable detail about why it failed.
 * Throwing variants are provided for use inside test frameworks.
 *
 * ConsoleCapture is optional — when not provided, expectClean()
 * only checks DOM content.
 */

import type { Document } from '../nodes/Document';
import type { Element } from '../nodes/Element';

// ── Interfaces ────────────────────────────────────────────────────────

export interface AssertionResult {
  passed: boolean;
  assertion: string;
  details?: string;
}

/**
 * Minimal interface for console capture integration.
 * Accepts any object that exposes getErrors() and getWarnings().
 */
export interface ConsoleCaptureLike {
  getErrors(): string[];
  getWarnings(): string[];
}

// ── DixieAssertions ───────────────────────────────────────────────────

export class DixieAssertions {
  private doc: Document;
  private console: ConsoleCaptureLike | undefined;

  constructor(document: Document, consoleCapture?: ConsoleCaptureLike) {
    this.doc = document;
    this.console = consoleCapture;
  }

  // ── Core assertions (non-throwing) ──────────────────────────────────

  /**
   * Checks that the page rendered cleanly:
   *  1. document.body exists and has content
   *  2. No console errors (if ConsoleCapture provided)
   *  3. No console warnings (if ConsoleCapture provided)
   */
  expectClean(): AssertionResult {
    const failures: string[] = [];

    // Check 1: body has content
    const body = this.doc.body;
    if (!body || body.innerHTML.length === 0) {
      failures.push('Body is empty or missing (innerHTML length: 0)');
    }

    // Check 2: no console errors
    if (this.console) {
      const errors = this.console.getErrors();
      if (errors.length > 0) {
        failures.push(`${errors.length} console error(s): ${errors.join('; ')}`);
      }
    }

    // Check 3: no console warnings
    if (this.console) {
      const warnings = this.console.getWarnings();
      if (warnings.length > 0) {
        failures.push(`${warnings.length} console warning(s): ${warnings.join('; ')}`);
      }
    }

    if (failures.length > 0) {
      return {
        passed: false,
        assertion: 'Page renders cleanly (content + no console errors/warnings)',
        details: failures.join('\n'),
      };
    }

    return {
      passed: true,
      assertion: 'Page renders cleanly (content + no console errors/warnings)',
    };
  }

  /**
   * Checks that document.body has non-empty innerHTML.
   * Optimized: checks for child nodes first (O(1)) instead of
   * serializing innerHTML. Falls back to innerHTML.trim() only
   * when children exist but might be whitespace-only text nodes.
   */
  expectContent(): AssertionResult {
    const body = this.doc.body;

    // Fast path: no body or no children at all
    const bodyChildren = body ? body.childNodes : null;
    if (!body || !bodyChildren || bodyChildren.length === 0) {
      return {
        passed: false,
        assertion: 'Body has content',
        details: 'Body is empty (innerHTML length: 0)',
      };
    }

    // Fast path: if any child is an element, we definitely have content
    let hasElementChild = false;
    for (let i = 0; i < bodyChildren.length; i++) {
      const child = bodyChildren[i];
      if (child.nodeType === 1) { // ELEMENT_NODE
        hasElementChild = true;
        break;
      }
    }

    if (hasElementChild) {
      return {
        passed: true,
        assertion: 'Body has content',
      };
    }

    // Slow path: only text nodes — check if they're whitespace-only
    const len = body.innerHTML.trim().length;
    if (len === 0) {
      return {
        passed: false,
        assertion: 'Body has content',
        details: 'Body is empty (innerHTML length: 0)',
      };
    }

    return {
      passed: true,
      assertion: 'Body has content',
    };
  }

  /**
   * Checks that an element matching the selector exists in the document.
   */
  expectElement(selector: string): AssertionResult {
    const el = this.doc.querySelector(selector);

    if (!el) {
      return {
        passed: false,
        assertion: `Element exists: ${selector}`,
        details: `No element matches selector: ${selector}`,
      };
    }

    return {
      passed: true,
      assertion: `Element exists: ${selector}`,
    };
  }

  /**
   * Checks that NO element matches the selector.
   */
  expectNoElement(selector: string): AssertionResult {
    const el = this.doc.querySelector(selector);

    if (el) {
      return {
        passed: false,
        assertion: `No element matches: ${selector}`,
        details: `Element found matching selector: ${selector}`,
      };
    }

    return {
      passed: true,
      assertion: `No element matches: ${selector}`,
    };
  }

  /**
   * Checks that the body text includes the given string.
   */
  expectText(text: string): AssertionResult {
    const bodyText = this.doc.body ? this.doc.body.textContent : '';

    if (!bodyText.includes(text)) {
      const preview = bodyText.substring(0, 200);
      const suffix = bodyText.length > 200 ? '...' : '';
      return {
        passed: false,
        assertion: `Text present: "${text}"`,
        details: `Text '${text}' not found in page. Body text starts with: '${preview}${suffix}'`,
      };
    }

    return {
      passed: true,
      assertion: `Text present: "${text}"`,
    };
  }

  /**
   * Checks that the body text does NOT include the given string.
   */
  expectNoText(text: string): AssertionResult {
    const bodyText = this.doc.body ? this.doc.body.textContent : '';

    if (bodyText.includes(text)) {
      return {
        passed: false,
        assertion: `Text absent: "${text}"`,
        details: `Text '${text}' was found in page but should not be present`,
      };
    }

    return {
      passed: true,
      assertion: `Text absent: "${text}"`,
    };
  }

  /**
   * Checks that an element matching the selector has the given attribute.
   * If value is provided, also checks that the attribute matches.
   */
  expectAttribute(selector: string, attr: string, value?: string): AssertionResult {
    const el = this.doc.querySelector(selector);
    const desc = value !== undefined
      ? `Attribute ${attr}="${value}" on ${selector}`
      : `Attribute ${attr} on ${selector}`;

    if (!el) {
      return {
        passed: false,
        assertion: desc,
        details: `No element matches selector: ${selector}`,
      };
    }

    const attrValue = el.getAttribute(attr);

    if (attrValue === null) {
      return {
        passed: false,
        assertion: desc,
        details: `Element '${selector}' does not have attribute '${attr}'`,
      };
    }

    if (value !== undefined && attrValue !== value) {
      return {
        passed: false,
        assertion: desc,
        details: `Attribute '${attr}' value is '${attrValue}', expected '${value}'`,
      };
    }

    return {
      passed: true,
      assertion: desc,
    };
  }

  /**
   * Checks that the number of elements matching the selector equals count.
   */
  expectElementCount(selector: string, count: number): AssertionResult {
    const elements = this.doc.querySelectorAll(selector);
    const actual = elements.length;

    if (actual !== count) {
      return {
        passed: false,
        assertion: `Element count: ${count} matching '${selector}'`,
        details: `Expected ${count} elements matching '${selector}', found ${actual}`,
      };
    }

    return {
      passed: true,
      assertion: `Element count: ${count} matching '${selector}'`,
    };
  }

  /**
   * Returns true if an element matching the selector exists.
   * Convenience wrapper around expectElement().
   */
  hasElement(selector: string): boolean {
    return this.expectElement(selector).passed;
  }

  // ── Batch runner ────────────────────────────────────────────────────

  /**
   * Run multiple assertions and return all results (does not short-circuit).
   */
  runAll(assertions: (() => AssertionResult)[]): AssertionResult[] {
    return assertions.map(fn => fn());
  }

  // ── Throwing variants (for test frameworks) ─────────────────────────

  assertClean(): void {
    const result = this.expectClean();
    if (!result.passed) {
      throw new Error(`Assertion failed: ${result.assertion}\n${result.details}`);
    }
  }

  assertContent(): void {
    const result = this.expectContent();
    if (!result.passed) {
      throw new Error(`Assertion failed: ${result.assertion}\n${result.details}`);
    }
  }

  assertElement(selector: string): void {
    const result = this.expectElement(selector);
    if (!result.passed) {
      throw new Error(`Assertion failed: ${result.assertion}\n${result.details}`);
    }
  }

  assertNoElement(selector: string): void {
    const result = this.expectNoElement(selector);
    if (!result.passed) {
      throw new Error(`Assertion failed: ${result.assertion}\n${result.details}`);
    }
  }

  assertText(text: string): void {
    const result = this.expectText(text);
    if (!result.passed) {
      throw new Error(`Assertion failed: ${result.assertion}\n${result.details}`);
    }
  }
}
