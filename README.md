# Dixie

Most browsers are designed for humans.

Dixie is a browser designed for agents.

Dixie is a DOM-level CLI browser that renders web pages, executes scripts, and exposes the entire page as structured data agents can query, test, and manipulate.
Instead of automating a real browser, Dixie implements the browser environment itself — including the DOM tree, CSS selector engine, events, forms, observers, timers, fetch, storage, and navigation.

This allows agents to:
- render pages
- query elements
- simulate interactions
- capture network activity
- run test scripts
- analyze structure and accessibility

All from a fast, deterministic CLI environment.
No Chromium.
No jsdom.
No browser automation layer.
Just a programmable DOM engine built for machines.

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

Not yet published to npm. Use via git clone or vendored copy:

```bash
git clone https://github.com/bedlamlabs/dixie.git
cd dixie
npm install
```

## CLI Usage

> **Security notice:** Dixie executes page scripts inside a Node.js `vm` sandbox.
> This sandbox is **not an isolation boundary** — rendered page code can access the host
> Node.js process via prototype chain escapes. Node's `vm` module explicitly provides
> no security guarantees. Only render pages from sources you trust.

```
dixie <command> [url] [selector] [options]
```

If the first argument is a URL, the command defaults to `render`.

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
| `inspect` | Detailed inspection of a single element | Stub |
| `component` | Component-level render and assertion | Stub |
| `fidelity` | Visual diff against a reference screenshot | Stub |
| `lighthouse` | Performance scoring (Dixie-native, no Chrome) | Stub |
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
import path from 'path';

export default defineConfig({
  test: {
    environment: path.resolve(__dirname, 'packages/dixie/vitest-env.ts'),
    // ...
  },
  resolve: {
    alias: {
      '@bedlamlabs/dixie': path.resolve(__dirname, 'packages/dixie/src'),
    },
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
