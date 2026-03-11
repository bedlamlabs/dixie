# Dixie

Dixie is a DOM-first browser toolkit for coding agents.

It gives agents a fast verification loop: fetch a page, build a live DOM, execute scripts, query the result, run checks, and move on without launching Chromium. Dixie is designed for agent workflows, CI checks, DOM assertions, and SPA inspection where speed and structured output matter more than pixel-perfect rendering.

## Quickstart

```bash
npm install @bedlamlabs/dixie

# Render a page and inspect the result as JSON
npx dixie render https://example.com/dashboard --format json

# Query the DOM
npx dixie query https://example.com/dashboard "button[data-action]"

# Run a quick accessibility pass
npx dixie a11y https://example.com/dashboard --format yaml
```

Node.js 18+ required.

## When To Use Dixie

Use Dixie when you need:

- Fast DOM verification in CI or agent loops
- Structured CLI output in `json`, `yaml`, `markdown`, or `csv`
- SPA rendering without a real browser process
- DOM queries by CSS selector, test ID, role, or label
- HAR capture and replay for mocked flows
- Page audits for a11y, links, forms, structure, text, and API activity

Use something else when you need:

- Screenshots or visual regression testing
- Real layout, geometry, or paint behavior
- Canvas, WebGL, or SVG rendering fidelity
- Strong isolation from untrusted page scripts

## Security

> **Security notice:** Dixie executes page scripts inside a Node.js `vm` sandbox.
> This sandbox is **not an isolation boundary**. Rendered page code can access the host
> Node.js process via known prototype-chain escape techniques. Only render pages from
> sources you trust.

## Install

```bash
npm install @bedlamlabs/dixie
```

Dixie ships TypeScript source and runs through Node-compatible tooling.

## CLI

```bash
npx dixie <command> [url] [selector] [options]
```

If the first argument is a URL, the command defaults to `render`.

### Most Common Commands

| Command       | What it does                                                 |
| ------------- | ------------------------------------------------------------ |
| `render`      | Fetches a page, executes scripts, and returns page metadata  |
| `query`       | Finds elements by CSS selector, test ID, role, label, or text |
| `a11y`        | Reports common accessibility issues                          |
| `links`       | Extracts links and buttons                                   |
| `forms`       | Extracts form fields, validation, and structure              |
| `text`        | Extracts visible text content                                |
| `mock-record` | Records network activity to HAR-style output                 |
| `mock-replay` | Replays HAR entries as mock routes                           |
| `snapshot`    | Captures a DOM snapshot for later comparison                 |
| `diff`        | Compares two snapshots structurally                          |

### Full Command Reference

| Command          | Description                                               | Status      |
| ---------------- | --------------------------------------------------------- | ----------- |
| `render`         | Fetch and render a URL, return DOM structure              | Full        |
| `query`          | Run a CSS/testId/role/label query against a rendered page | Full        |
| `run`            | Execute a test file (`.ts`/`.js`) against a URL           | Full        |
| `bench`          | Benchmark DOM parse/query/mutate operations               | Full        |
| `diff`           | Compare two DOM snapshots structurally                    | Full        |
| `mock-record`    | Render a URL and record network activity to a HAR file    | Full        |
| `mock-replay`    | Replay a HAR file as mock routes while rendering a URL    | Full        |
| `snapshot`       | Capture a DOM snapshot (structure hash + text summary)    | Full        |
| `init`           | Scaffold a `.dixie/` config directory for a project       | Full        |
| `a11y`           | Accessibility audit (missing alt, labels, ARIA)           | Collector   |
| `css-audit`      | CSS analysis (unused selectors, specificity)              | Collector   |
| `links`          | Extract and validate all links on a page                  | Collector   |
| `forms`          | Extract form structure, inputs, validation state          | Collector   |
| `text`           | Extract visible text content                              | Collector   |
| `structure`      | Page structure analysis (headings, landmarks, sections)   | Collector   |
| `api`            | Trace API calls made during page render                   | Collector   |
| `expected-calls` | Verify expected API calls were made                       | Collector   |
| `click`          | Simulate a click on a selector                            | Interaction |
| `type`           | Type text into an input element                           | Interaction |
| `select`         | Select an option in a dropdown                            | Interaction |
| `inspect`        | Detailed inspection of a single element                   | Full        |
| `component`      | Component-level render and assertion                      | Full        |
| `lighthouse`     | Performance scoring (Dixie-native, no Chrome)             | Full        |
| `har`            | Export captured network activity as HAR 1.2               | Full        |
| `redact`         | Strip sensitive data from snapshots/headers               | Full        |

### Global Options

| Flag                      | Description                                                 | Default       |
| ------------------------- | ----------------------------------------------------------- | ------------- |
| `--format <fmt>`          | Output format: `json`, `yaml`, `markdown`, `csv`            | `json`        |
| `--token <jwt>`           | Auth token (sent as `Authorization: Bearer`)                | -             |
| `--timeout <ms>`          | Request or operation timeout in milliseconds                | `5000`        |
| `--config <path>`         | Path to config file (`.dixie/*.ts`)                         | auto-detected |
| `--filter <str>`          | Filter results by string match                              | -             |
| `--text <string>`         | `query` only: find elements whose text contains this string | -             |
| `--selector-strategy <s>` | `css`, `testId`, `role`, or `label`                         | `css`         |
| `--no-js`                 | Skip script execution entirely                              | `false`       |
| `--parallel`              | Run operations in parallel where possible                   | `false`       |
| `--verbose`               | Verbose output                                              | `false`       |
| `--bail`                  | Stop on first error                                         | `false`       |
| `--no-color`              | Disable colored output                                      | `false`       |
| `--version`               | Print version and exit                                      | -             |
| `--help`                  | Print usage and exit                                        | -             |

## Examples

```bash
# Render a page and get structured output
dixie render https://example.com/dashboard --token $TOKEN --format json

# Query by CSS selector
dixie query https://example.com/projects button --format yaml

# Find elements by visible text
dixie query https://example.com/settings --text "Subscribe"

# Find elements by test ID
dixie query https://example.com/invoices "[data-testid='invoice-row']" \
  --selector-strategy testId

# Record network traffic
dixie mock-record https://example.com/dashboard --token $TOKEN > session.har

# Replay a recorded session as mock routes
dixie mock-replay https://example.com/dashboard session.har

# Compare two snapshots
dixie diff snapshot-before.json snapshot-after.json --format markdown
```

### Sample Output

```json
{
  "url": "https://example.com/dashboard",
  "title": "Dashboard",
  "renderMs": 42.3,
  "parseMs": 3.1,
  "configSource": "defaults",
  "elementCount": 187,
  "errors": []
}
```

## Running Tests

The `run` command is for small agent-oriented test scripts. A test file should export a default function.

```ts
export default async function () {
  return {
    passed: true,
    notes: ['login button present'],
  };
}
```

Example:

```bash
dixie run smoke.ts --config .dixie/example.com.ts --format yaml
```

## Agent API

Agents can call Dixie as a subprocess and parse structured output:

```bash
RESULT=$(dixie render https://example.com/dashboard --token "$JWT" --format json)
BUTTONS=$(dixie query https://example.com/dashboard "button[data-action]" --format json)
dixie run check-login-flow.ts --config .dixie/example.com.ts --format yaml
```

Agents can also use Dixie programmatically:

```ts
import { createDixieEnvironment, renderUrl, getByTestId } from '@bedlamlabs/dixie';

const env = createDixieEnvironment({ url: 'https://example.com' });

const result = await renderUrl('https://example.com/dashboard', {
  token: process.env.AUTH_TOKEN,
});

const button = getByTestId(env.document, 'submit-button');
```

## Vitest Environment

Dixie provides a custom Vitest environment:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: '@bedlamlabs/dixie/vitest-env',
  },
});
```

Or per-file override when a specific test needs jsdom:

```ts
// @vitest-environment jsdom
import { describe, test } from 'vitest';
```

## Per-Domain Config

Create `.dixie/<domain>.ts` files to configure auth, mock routes, and noise filtering per target:

```ts
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

## Known Limitations

- **No layout engine**: `getBoundingClientRect`, `offsetWidth`, `offsetHeight`, `scrollWidth`, and related geometry APIs return zero values.
- **No painting**: `<canvas>`, WebGL, and SVG rendering are not evaluated.
- **No CSS cascade engine**: `getComputedStyle` returns inline styles only; media queries and computed values are not resolved.
- **Not a visual browser**: use Playwright, Puppeteer, or a real browser when screenshots or layout fidelity matter.

## Why Dixie

Dixie was built to help support [ThriveOS](https://thriveos.pro) scale their CI and improve Agent effectiveness (aka reduce the classic verification hallucination phenomena). Dixie's niche is speed plus breadth for automation pipelines: parse, query, test, record, audit, and diff pages without launching a browser process.

### Comparison

| Capability             | Dixie                                   | [Happy-DOM](https://github.com/nicedayfor/happy-dom) | [Lightpanda](https://github.com/nicedayfor/lightpanda) | [agent-browser](https://github.com/nicedayfor/agent-browser) |
| ---------------------- | --------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| **Install**            | `npm install` (pure JS)                 | `npm install` (pure JS)                              | `npm install` (binary)                                 | `npm install` (needs Playwright)                             |
| **DOM parsing**        | Full HTML parser + `querySelectorAll`   | Full HTML parser + `querySelectorAll`                | Full native parser                                     | Chromium via Playwright                                      |
| **JS execution**       | Node `vm` + esbuild                     | Partial                                              | Full V8-compatible                                     | Full Chromium                                                |
| **React SPA support**  | Yes                                     | Manual `document.write()` style workflows            | Via CDP or fetch mode                                  | Yes                                                          |
| **CLI interface**      | Rich, structured CLI                    | Library only                                         | CDP server / fetch API                                 | Agent-friendly browser CLI                                   |
| **Output formats**     | JSON, YAML, Markdown, CSV               | Programmatic only                                    | HTML string                                            | Accessibility tree / browser output                          |
| **Network recording**  | HAR capture + replay                    | No                                                   | No                                                     | No                                                           |
| **Test runner**        | Built-in `run` for `.ts` / `.js`        | Vitest environment only                              | No                                                     | No                                                           |
| **Page analysis**      | a11y, links, forms, structure, CSS, API | No                                                   | No                                                     | Limited                                                      |
| **Vitest environment** | Yes                                     | Yes                                                  | No                                                     | No                                                           |
| **Snapshot diffing**   | Structural diff                         | No                                                   | No                                                     | No                                                           |
| **Auth support**       | Built-in token/config flow              | Manual                                               | Manual                                                 | Manual                                                       |
| **Layout engine**      | No                                      | No                                                   | Partial                                                | Yes                                                          |
| **Visual rendering**   | No                                      | No                                                   | No screenshots                                         | Yes                                                          |

Each tool has a different sweet spot:

- Happy-DOM is battle-tested as a test environment.
- Lightpanda is interesting when you want a faster browser with some layout support.
- agent-browser is useful when you need a real browser that agents can drive.
- Dixie is strongest when you want fast DOM-first verification with a broad automation surface.

### Benchmark

Same HTML parsed in-process by each engine. Median of 3 runs per page.

| Page                    | Dixie      | Happy-DOM   | Lightpanda*  |
| ----------------------- | ---------- | ----------- | ------------ |
| Public homepage (44 KB) | **0.6 ms** | 5.6 ms      | 413 ms       |
| Public landing (4.5 KB) | **0.1 ms** | 1.1 ms      | 536 ms       |
| SPA shell (6.4 KB)      | **0.1 ms** | 1.8 ms      | 686 ms       |
| SPA list (6.4 KB)       | **0.1 ms** | 1.2 ms      | 691 ms       |
| SPA detail (6.4 KB)     | **0.1 ms** | 1.1 ms      | 526 ms       |
| **Total**               | **1.0 ms** | **10.8 ms** | **2,851 ms** |

*Lightpanda was measured through its `fetch()` API, so that number includes network round-trip and is not a pure parse-only comparison. `agent-browser` is excluded because it requires a browser process and is not comparable to in-process DOM engines.*

For pure DOM parse/query workloads, Dixie is much closer to "verification primitive" than "browser session". That is the point: fast feedback loops for agents and CI, not visual fidelity.

## DOM Engine

Dixie's browser environment is built from scratch rather than wrapped around jsdom.

**Nodes**: Document, Element, Text, Comment, DocumentFragment, Attr
**Collections**: NodeList, HTMLCollection, NamedNodeMap, DOMTokenList
**Form elements**: HTMLInputElement, HTMLSelectElement, HTMLTextAreaElement, HTMLFormElement, HTMLOptionElement, HTMLButtonElement, HTMLLabelElement
**Events**: Event, CustomEvent, UIEvent, MouseEvent, KeyboardEvent, FocusEvent, InputEvent, PointerEvent, EventTarget
**Browser APIs**: Window, Location, History, Navigator, Screen, Storage, Timers, matchMedia, getComputedStyle
**Observers**: MutationObserver, ResizeObserver, IntersectionObserver
**CSS**: CSSStyleDeclaration, selector engine (tag, class, id, attribute, pseudo-class, combinators)
**Parser**: HTML parser and serializer
**Network**: Mock fetch, HAR recorder, EventSource stub, WebSocket stub

## Architecture

```text
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
  auth/           # TokenAcquisition
  render/         # RenderContext, RenderHarness
  queries/        # testId, role, label queries
  interaction/    # click, type, select
  collectors/     # a11y, links, forms, text, structure, css-audit, api
  execution/      # VM context and script loader
  har/            # HAR recorder and exporter
  network/        # EventSource and WebSocket stubs
  cli/            # CLI parser, dispatch, config loader, formatter
  redact.ts       # Header and snapshot redaction
  vitest-env/     # Vitest environment adapter
bin/
  dixie.ts        # CLI entry point
```

## License

MIT
