# Dixie

Dixie is a browser and toolkit designed for coding agents.

Modern AI coding workflows work best when they follow tight feedback loops: write code, run tests, verify behavior, repeat. In practice, that loop often breaks down when the verification step depends on slow, heavyweight browser environments. Spinning up Chromium just to confirm a DOM change or check a selector can add seconds—or minutes—to every iteration.
Dixie shortens that loop.

It provides a browser-like environment agents can run entirely from the command line. Dixie fetches pages, builds a DOM, executes scripts (including modern SPA bundles), and exposes the result as structured data agents can query, test, and inspect.

Instead of automating a real browser, Dixie implements the browser environment itself: the DOM tree, selector engine, events, forms, observers, timers, fetch, storage, and navigation. That makes it fast, deterministic, and easy to run anywhere Node.js runs.

In practice, agents use Dixie to:

- **Render and query pages** — fetch HTML, build a live DOM, and query it using CSS selectors, test IDs, ARIA roles, or labels
- **Write and run tests quickly** execute .ts or .js test files against a page without waiting for a full browser to start
- **Verify changes during development** confirm DOM structure, text, and interactions as code evolves
- **Capture and replay network activity** record HAR files and replay them to mock APIs
- **Inspect and audit pages** analyze accessibility, links, forms, structure, CSS usage, and API calls
- **Diff and benchmark** compare DOM snapshots and measure parse/query/mutation performance
- **Built for fast CI verification** unlike Playwright or Puppeteer, Dixie runs directly against a DOM engine instead of launching Chromium, which dramatically reduces test runtime and keeps CI feedback fast.

Fast. Deterministic. Zero browser dependencies. One `npm install`.

## Why Dixie

There are several good tools in this space. Here's how they compare:

| Capability | Dixie | [Happy-DOM](https://github.com/nicedayfor/happy-dom) | [Lightpanda](https://github.com/nicedayfor/lightpanda) | [agent-browser](https://github.com/nicedayfor/agent-browser) |
|---|---|---|---|---|
| **Install** | `npm install` (pure JS) | `npm install` (pure JS) | `npm install` (Zig binary) | `npm install` (needs Playwright) |
| **DOM parsing** | Full HTML parser + querySelectorAll | Full HTML parser + querySelectorAll | Full Zig-native parser | Chromium via Playwright |
| **JS execution** | Node vm sandbox + esbuild | Partial (no bundling) | Full V8-compatible | Full Chromium |
| **React SPA support** | Yes (fetches bundles, runs React scheduler) | Manual `document.write()` only | Via CDP or fetch mode | Yes (real browser) |
| **CLI interface** | 23 commands, structured output | Library only | CDP server or fetch API | `open`/`snapshot`/`click` |
| **Output formats** | JSON, YAML, Markdown, CSV | Programmatic only | HTML string | Accessibility tree text |
| **Network recording** | HAR 1.2 capture + replay | No | No | No |
| **Test runner** | Built-in (run `.ts`/`.js` test files) | Vitest environment only | No | No |
| **Page analysis** | a11y, links, forms, structure, CSS, API audit | No | No | No |
| **Vitest environment** | Yes (`@bedlamlabs/dixie/vitest-env`) | Yes (`happy-dom`) | No | No |
| **Snapshot diffing** | Structural diff with change detection | No | No | No |
| **Auth support** | Built-in token acquisition | Manual | Manual | Manual |
| **Binary size** | ~2 MB (pure JS + esbuild) | ~1.5 MB | ~15 MB (Zig binary) | ~200 MB (Chromium) |
| **Layout engine** | No (returns zero for geometry) | No | Yes (partial) | Yes (full Chromium) |
| **Visual rendering** | No | No | No | Yes (screenshots) |

Each tool has its strengths. Happy-DOM is battle-tested and widely used as a Vitest environment. Lightpanda is impressively fast for a full browser — written in Zig with real layout support. agent-browser gives you actual Chromium rendering with an agent-friendly CLI.

Dixie's niche is **speed + breadth for automation pipelines**: when you need to parse, query, test, record, audit, and diff pages in CI or agent workflows without spinning up a browser process.

### Benchmark

Same HTML parsed in-process by each engine. Median of 3 runs per page.

| Page | Dixie | Happy-DOM | Lightpanda* |
|---|---|---|---|
| Public homepage (44 KB) | **0.6 ms** | 5.6 ms | 413 ms |
| Public landing (4.5 KB) | **0.1 ms** | 1.1 ms | 536 ms |
| SPA shell (6.4 KB) | **0.1 ms** | 1.8 ms | 686 ms |
| SPA list (6.4 KB) | **0.1 ms** | 1.2 ms | 691 ms |
| SPA detail (6.4 KB) | **0.1 ms** | 1.1 ms | 526 ms |
| **Total** | **1.0 ms** | **10.8 ms** | **2,851 ms** |

*Lightpanda measured via its `fetch()` API, which includes network round-trip — not a pure parse comparison. agent-browser excluded as it requires a Playwright process (not comparable in-process).*

Dixie is ~11x faster than Happy-DOM for HTML parsing and DOM queries. This matters in CI pipelines where you're running hundreds of page checks per deploy.

## What Dixie Does

- **Renders web pages** — fetches HTML, parses it into a DOM tree, fetches and executes scripts (including Vite/webpack bundles via esbuild), flushes React's async scheduler
- **Queries the DOM** — CSS selectors, test IDs, ARIA roles, labels
- **Interacts with elements** — click, type, select (no real UI, just DOM mutations)
- **Captures everything** — console output, network calls (HAR 1.2), errors, accessibility issues
- **Runs test files** — execute `.ts`/`.js` test scripts against any URL
- **Benchmarks DOM operations** — parse/query/mutate timing with percentile stats
- **Diffs snapshots** — structural comparison of two DOM captures
- **Formats output** — JSON, YAML, Markdown, CSV (agents pick their format)

## Install

```bash
npm install @bedlamlabs/dixie
```

Dixie ships TypeScript source and requires [tsx](https://github.com/privatenumber/tsx) as a runtime (included as a dependency).

Node.js 18+ required.

## CLI Usage

```bash
npx @bedlamlabs/dixie <command> [url] [selector] [options]
```

Or if installed globally / in a project:

```bash
npx dixie <command> [url] [selector] [options]
```

If the first argument is a URL, the command defaults to `render`.

> **Security notice:** Dixie executes page scripts inside a Node.js `vm` sandbox.
> This sandbox is **not an isolation boundary** — rendered page code can access the host
> Node.js process via prototype chain escapes. Node's `vm` module explicitly provides
> no security guarantees. Only render pages from sources you trust.

### Commands

| Command | Description | Status |
|---------|-------------|--------|
| `render` | Fetch and render a URL, return DOM structure | Full |
| `query` | Run a CSS/testId/role/label query against a rendered page | Full |
| `run` | Execute a test file (`.ts`/`.js`) against a URL | Full |
| `bench` | Benchmark DOM parse/query/mutate operations | Full |
| `diff` | Compare two DOM snapshots structurally | Full |
| `mock-record` | Render a URL and record network activity to a HAR file | Full |
| `mock-replay` | Replay a HAR file as mock routes while rendering a URL | Full |
| `snapshot` | Capture a DOM snapshot (structure hash + text summary) | Full |
| `init` | Scaffold a `.dixie/` config directory for a project | Full |
| `a11y` | Accessibility audit (missing alt, labels, ARIA) | Collector |
| `css-audit` | CSS analysis (unused selectors, specificity) | Collector |
| `links` | Extract and validate all links on a page | Collector |
| `forms` | Extract form structure, inputs, validation state | Collector |
| `text` | Extract visible text content | Collector |
| `structure` | Page structure analysis (headings, landmarks, sections) | Collector |
| `api` | Trace API calls made during page render | Collector |
| `expected-calls` | Verify expected API calls were made | Collector |
| `click` | Simulate a click on a selector | Interaction |
| `type` | Type text into an input element | Interaction |
| `select` | Select an option in a dropdown | Interaction |
| `inspect` | Detailed inspection of a single element | Full |
| `component` | Component-level render and assertion | Full |
| `lighthouse` | Performance scoring (Dixie-native, no Chrome) | Full |
| `har` | Export captured network activity as HAR 1.2 | Full |
| `redact` | Strip sensitive data from snapshots/headers | Full |

### Global Options

| Flag | Description | Default |
|------|-------------|---------|
| `--format <fmt>` | Output format: `json`, `yaml`, `markdown`, `csv` | `json` |
| `--token <jwt>` | Auth token (sent as `Authorization: Bearer`) | — |
| `--timeout <ms>` | Request/operation timeout in milliseconds | `5000` |
| `--config <path>` | Path to config file (`.dixie/*.ts`) | auto-detected |
| `--filter <str>` | Filter results by string match | — |
| `--text <string>` | (`query` only) Find elements whose text content contains this string | — |
| `--selector-strategy <s>` | Query strategy: `css`, `testId`, `role`, `label` | `css` |
| `--no-js` | Skip script execution entirely | `false` |
| `--parallel` | Run operations in parallel where possible | `false` |
| `--verbose` | Verbose output | `false` |
| `--bail` | Stop on first error | `false` |
| `--no-color` | Disable colored output | `false` |
| `--version` | Print version and exit | — |
| `--help` | Print usage and exit | — |

### Examples

```bash
# Render a page, get JSON structure (works for React SPAs — scripts are fetched and executed)
dixie render https://example.com/dashboard --token $TOKEN

# Query by CSS selector
dixie query https://example.com/projects button --format yaml

# Find elements by text content (exitCode 1 when not found — CI-friendly)
dixie query https://example.com/settings --text "Subscribe"

# Find elements by test ID
dixie query https://example.com/invoices "[data-testid='invoice-row']" \
  --selector-strategy testId

# Run a test file against a URL
dixie run smoke.ts --config .dixie/example.com.ts

# Benchmark DOM parsing (100 iterations)
dixie bench https://example.com/dashboard

# Compare two snapshots
dixie diff snapshot-before.json snapshot-after.json --format markdown

# Record network activity as HAR
dixie mock-record https://example.com/dashboard --token $TOKEN > session.har

# Replay a HAR file as mock routes
dixie mock-replay https://example.com/dashboard session.har

# Capture a DOM snapshot
dixie snapshot https://example.com/dashboard --format yaml

# Accessibility audit
dixie a11y https://example.com/settings --format yaml

# Extract all links
dixie links https://example.com/clients --format csv

# Scaffold a config directory
dixie init
```

## Agent API

Agents call Dixie as a subprocess and parse structured output:

```bash
# Agent gets page structure as JSON
RESULT=$(dixie render https://example.com/dashboard \
  --token "$JWT" --format json)

# Agent queries for specific elements
BUTTONS=$(dixie query https://example.com/dashboard \
  "button[data-action]" --format json)

# Agent runs a test script
dixie run check-login-flow.ts --config .dixie/example.com.ts --format yaml
```

Agents can also use Dixie programmatically via import:

```typescript
import { createDixieEnvironment, renderUrl, getByTestId } from '@bedlamlabs/dixie';

// Create an isolated browser environment
const env = createDixieEnvironment({ url: 'https://example.com' });

// Render a page
const result = await renderUrl('https://example.com/dashboard', {
  token: process.env.AUTH_TOKEN,
});

// Query the DOM
const button = getByTestId(env.document, 'submit-button');
```

## Vitest Environment

Dixie provides a custom vitest environment — a drop-in replacement for jsdom or happy-dom:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: '@bedlamlabs/dixie/vitest-env',
  },
});
```

Or per-file override when a specific test needs jsdom:

```typescript
// @vitest-environment jsdom
import { describe, test } from 'vitest';
// This file uses jsdom instead of Dixie
```

## Per-Domain Config

Create `.dixie/<domain>.ts` files to configure auth, mock routes, and noise filtering per target:

```typescript
// .dixie/localhost.5001.ts
import type { DixieConfig } from '@bedlamlabs/dixie';

const config: DixieConfig = {
  auth: {
    baseUrl: 'https://example.com',
    loginEndpoint: '/api/auth/login',
    credentials: {
      email: 'test@example.com',
      password: 'password123',
    },
  },
  noisePatterns: [
    'Download the .* app',
    'favicon.ico',
  ],
};

export default config;
```

Dixie auto-detects configs by matching the URL's domain and port against filenames in `.dixie/`.

## DOM Engine

Dixie's DOM is built from scratch — not a wrapper around jsdom or any other implementation.

**Nodes**: Document, Element, Text, Comment, DocumentFragment, Attr
**Collections**: NodeList, HTMLCollection, NamedNodeMap, DOMTokenList
**Form elements**: HTMLInputElement, HTMLSelectElement, HTMLTextAreaElement, HTMLFormElement, HTMLOptionElement, HTMLButtonElement, HTMLLabelElement
**Events**: Event, CustomEvent, UIEvent, MouseEvent, KeyboardEvent, FocusEvent, InputEvent, PointerEvent, EventTarget
**Browser APIs**: Window, Location, History, Navigator, Screen, Storage, Timers, matchMedia, getComputedStyle
**Observers**: MutationObserver, ResizeObserver, IntersectionObserver
**CSS**: CSSStyleDeclaration, selector engine (tag, class, id, attribute, pseudo-class, combinators)
**Parser**: HTML parser and serializer
**Network**: Mock fetch, HAR recorder, EventSource stub, WebSocket stub

## Known Limitations

- **No layout engine** — `getBoundingClientRect`, `offsetWidth`, `offsetHeight`, `scrollWidth`, and all geometry APIs return zero values. CSS box sizing is not computed.
- **No painting** — `<canvas>`, WebGL, and SVG rendering are not evaluated.
- **CSS transitions not applied** — `getComputedStyle` returns inline styles only; cascade, media queries, and computed values are not resolved.

## Architecture

```
src/
  nodes/          # DOM node types (Document, Element, Text, etc.)
  collections/    # NodeList, HTMLCollection, NamedNodeMap, DOMTokenList
  events/         # Event system (Event, MouseEvent, EventTarget, etc.)
  browser/        # Window, Location, History, Navigator, Screen, Storage, Timers
  observers/      # MutationObserver, ResizeObserver, IntersectionObserver
  css/            # CSSStyleDeclaration
  selectors/      # CSS selector parser and matcher
  parser/         # HTML parser and serializer
  environment/    # DixieEnvironment factory, EnvironmentPool, global installer
  fetch/          # MockFetch, DixieRequest/Response/Headers, ContractValidator
  console/        # ConsoleCapture with noise filtering
  assertions/     # DixieAssertions, DixieSnapshot, DiffSnapshot, PerformanceBudget
  auth/           # TokenAcquisition (login flow for authenticated pages)
  render/         # RenderContext, RenderHarness
  queries/        # Testing Library-style queries (testId, role, label)
  interaction/    # click, type, select (DOM-level interaction)
  collectors/     # Page analysis (a11y, links, forms, text, structure, css-audit, api)
  execution/      # VM context and script loader (inline <script> execution)
  har/            # HAR 1.2 recorder and exporter
  network/        # EventSource and WebSocket stubs
  cli/            # CLI parser, command dispatch, config loader, output formatter
  redact.ts       # Header and snapshot redaction
  vitest-env/     # Vitest custom environment adapter
bin/
  dixie.ts        # CLI entry point
```

## License

MIT
