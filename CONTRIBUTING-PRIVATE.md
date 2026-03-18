# Dixie Development Rules (Private)

Rules for developing Dixie as a generic tool. Violations here caused production bugs.

## Rule 1: No App-Specific Code in the Engine

Dixie (`packages/dixie/src/`) must be app-agnostic. All app-specific behavior goes in `.dixie/` config files.

**What goes in the engine:**
- DOM methods (Node, Element, Document)
- VM sandbox globals (browser APIs)
- esbuild bundling (IIFE conversion, namespace de-duplication)
- Event loop flushing (React scheduler support)
- CLI commands (render, query, click)
- Config loading and applying

**What goes in `.dixie/*.ts` config:**
- Auth credentials and token key names (`preseed.localStorage`)
- Session markers (`preseed.sessionStorage`)
- Error suppression patterns (`suppressErrors`)
- Mount selectors (`spa.mountSelector`)
- Noise patterns (`noisePatterns`)

**How to check:** Search the engine for any string literal that only appears in one app's codebase. If you find `thriveos`, `honeybook`, `dubsado`, or any app-specific identifier in `packages/dixie/src/`, it's a violation.

### Config Fields for App-Specific Behavior

```typescript
// .dixie/myapp.com.ts
const config: DixieConfig = {
  auth: { ... },
  spa: { mountSelector: '#root > *' },

  // Pre-seed storage before SPA scripts run
  preseed: {
    localStorage: {
      'my_auth_token': '{{token}}',      // {{token}} is replaced with acquired token
      'lastActivity': Date.now().toString(),
    },
    sessionStorage: {
      'session_active': 'true',
    },
  },

  // Suppress specific throw messages in the bundled IIFE
  // Use when a component throws without an error boundary and
  // crashes React's tree during click re-renders
  suppressErrors: [
    'useMyHook must be used within MyProvider',
  ],
};
```

## Rule 2: Test Against the Dixie Repo, Not Just ThriveOS

Changes to `packages/dixie/` must be pushed to BOTH repos:
- `origin` (ThriveOS monorepo) — for CI
- `bedlamlabs-dixie` (Dixie standalone) — for the package

```bash
# After committing to ThriveOS:
git subtree push --prefix=packages/dixie bedlamlabs-dixie main
```

## Rule 3: esbuild Namespace De-duplication

When bundling SPAs, ALL modules must live in the same esbuild namespace (`dixie-http`). Using `stdin` for the entry creates a different namespace, causing duplicate `createContext()` calls. See `script-loader.ts` — uses `entryPoints` with an `onResolve` handler for `kind: 'entry-point'`.

## Rule 4: Vite Preload Bypass

Vite's `Ii` function creates `<link rel="modulepreload">` tags that don't work in the VM. The bypass (`Ii=function(e,t,n){return e();}`) is applied in `script-loader.ts` via string replacement on the entry code. This is Vite-specific but NOT app-specific — any Vite app needs it.

## Rule 5: DOM Compatibility with React

React 18 requires these DOM methods that browsers have but Dixie may be missing:
- `isConnected` — React's commit phase skips DOM updates if false/undefined
- `ownerDocument` — must never return null for connected or recently-disconnected nodes
- `removeChild` — must be lenient (no-op, not throw) when child is already detached
- `compareDocumentPosition` — React uses for ordering checks
- `replaceChildren` — React uses for batch updates

When adding DOM methods, test with a real React app, not just unit tests.
