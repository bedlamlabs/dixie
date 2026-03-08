/**
 * Dixie — Ground-up DOM environment and test framework.
 *
 * This is the main entry point. Features are added incrementally
 * by the build loop. Each round adds a new capability.
 */

export const VERSION = '4.0.0';

// Round 1: Node tree structure
export { Node } from './nodes/Node';
export { NodeList } from './nodes/NodeList';

// Round 2: Element, Text, Comment, and supporting classes
export { Element } from './nodes/Element';
export { Text } from './nodes/Text';
export { Comment } from './nodes/Comment';
export { Attr } from './nodes/Attr';
export { NamedNodeMap } from './collections/NamedNodeMap';
export { DOMTokenList } from './collections/DOMTokenList';
export { HTMLCollection } from './collections/HTMLCollection';

// Round 3: Document and DocumentFragment
export { Document } from './nodes/Document';
export { DocumentFragment } from './nodes/DocumentFragment';

// Round 4: HTML parsing and serialization
import { parseHTML as _parseHTMLInternal } from './parser';
import { Document as _DocumentInternal } from './nodes/Document';
export { serializeHTML } from './parser';

/**
 * Parse HTML string into DOM nodes.
 * When called with a Document, returns Node[] (internal use).
 * When called without a Document, creates one and returns it (convenience).
 */
export function parseHTML(html: string, document?: any): any {
  if (!document) {
    const doc = new _DocumentInternal();
    const nodes = _parseHTMLInternal(html, doc);
    for (const node of nodes) {
      doc.body.appendChild(node);
    }
    return doc;
  }
  return _parseHTMLInternal(html, document);
}

// Round 5: CSS selector engine
export { parseSelector } from './selectors';
export { matchesSelector, querySelectorAllElements, querySelectorFirstElement } from './selectors';

// Round 6: Event system
export { Event, CustomEvent, EventTarget } from './events';
export { UIEvent, MouseEvent, KeyboardEvent, FocusEvent, InputEvent, PointerEvent } from './events';

// Round 7: Browser APIs
export { Window } from './browser/Window';
export { Location } from './browser/Location';
export { History } from './browser/History';
export { Navigator } from './browser/Navigator';
export { Screen } from './browser/Screen';
export { createStorage } from './browser/Storage';
export { TimerController } from './browser/Timers';

// Round 8: CSS Style
export { CSSStyleDeclaration } from './css';

// Round 9: Observers
export { MutationObserver, triggerMutation, flushMutations, clearMutationRegistry } from './observers';
export { MutationRecord } from './observers';
export { ResizeObserver } from './observers';
export { IntersectionObserver } from './observers';

// Round 11: Environment
export { createDixieEnvironment } from './environment';
export type { DixieEnvironment, DixieEnvironmentOptions } from './environment';
export { EnvironmentPool } from './environment';
export type { PoolOptions, PoolStats } from './environment';
export { installGlobals } from './environment';
export type { GlobalInstallation } from './environment';

// Round 10: Form Elements
export { HTMLInputElement } from './nodes/HTMLInputElement';
export { HTMLSelectElement } from './nodes/HTMLSelectElement';
export { HTMLTextAreaElement } from './nodes/HTMLTextAreaElement';
export { HTMLFormElement } from './nodes/HTMLFormElement';
export { HTMLOptionElement } from './nodes/HTMLOptionElement';
export { HTMLButtonElement } from './nodes/HTMLButtonElement';
export { HTMLLabelElement } from './nodes/HTMLLabelElement';

// Round 12: Console Capture
export { ConsoleCapture, DEFAULT_NOISE_PATTERNS } from './console';
export type { ConsoleCaptureOptions } from './console';

// Round 13: Mock Fetch
export { MockFetch } from './fetch';
export { DixieResponse } from './fetch';
export { DixieRequest } from './fetch';
export { DixieHeaders } from './fetch';
export { ContractValidator } from './fetch';

// Round 14: Assertions & Snapshots
export { DixieAssertions, DixieSnapshot, DiffSnapshot } from './assertions';
export { PerformanceBudget } from './assertions';
export type { BudgetConfig, BudgetResult } from './assertions';

// Round 15: Vitest Environment
export { default as dixieEnvironment } from './vitest-env/dixie-environment';

// Round 16: Token Acquisition
export { TokenAcquisition } from './auth';
export type { TokenConfig, TokenResult } from './auth';

// Round 17: Render Harness
export { RenderContext, RenderHarness } from './render';
export type { RenderResult, RenderOptions } from './render';

// ── v3 Standalone Exports ─────────────────────────────────────────

// CLI
export { parseArgs, dispatch } from './cli';
export { formatOutput } from './cli/format';
export { resolveConfig, domainFromUrl } from './cli/config-loader';
export type { ParsedArgs, CommandResult, DixieConfig, AuthStrategy, DixieConfigV4 } from './cli/types';

// Commands
export { renderUrl } from './cli/commands/render';
export { runBenchmark } from './cli/commands/bench';
export { diffSnapshots } from './cli/commands/diff';
export { runTestFile } from './cli/commands/run';
export { scaffoldInit } from './cli/commands/init';

// Collectors
export { collectA11y } from './collectors/a11y';
export { collectCssAudit } from './collectors/css-audit';
export { collectLinks } from './collectors/links';
export { collectForms } from './collectors/forms';
export { collectText } from './collectors/text';
export { collectStructure } from './collectors/structure';
export { collectConsole } from './collectors/console';
export { collectApi } from './collectors/api';
export { collectExpectedCalls } from './collectors/expected-calls';
export { collectErrors } from './collectors/errors';

// Queries
export { getByTestId, getAllByTestId } from './queries/test-id';
export { getByRole, getAllByRole } from './queries/role';
export { getByLabel, getAllByLabel } from './queries/label';

// Interaction
export { click } from './interaction/click';
export { type } from './interaction/type';
export { select } from './interaction/select';

// Agent API
export { waitForSettle } from './interaction/waitForSettle';
export { action } from './interaction/action';
export type { ActionResult } from './interaction/action';

// Execution
export { createVmContext } from './execution/vm-context';
export { loadScripts } from './execution/script-loader';

// HAR
export { HarRecorder } from './har/recorder';
export { exportHar } from './har/exporter';

// Redact
export { redactHeaders, redactSnapshot } from './redact';

// Network stubs
export { EventSourceStub } from './network/sse';
export { WebSocketStub } from './network/websocket';
