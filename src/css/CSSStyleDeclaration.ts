/**
 * CSSStyleDeclaration — the object returned by element.style.
 *
 * Provides both camelCase property access (style.backgroundColor = 'red')
 * and method-based access (style.setProperty('background-color', 'red')).
 *
 * Uses a Proxy to intercept property access and translate between
 * camelCase (JS) and kebab-case (CSS).
 */

// ── Name conversion helpers ─────────────────────────────────────────

/**
 * Convert camelCase to kebab-case.
 * - `backgroundColor` → `background-color`
 * - `webkitTransform` → `-webkit-transform` (vendor prefix)
 * - `MozTransition` → `-moz-transition` (vendor prefix)
 */
export function camelToKebab(name: string): string {
  // Handle vendor prefixes: webkit, moz, ms, o
  // If the name starts with a lowercase vendor prefix followed by uppercase,
  // add a leading dash
  const kebab = name.replace(/[A-Z]/g, (match, offset) => {
    return (offset > 0 ? '-' : '') + match.toLowerCase();
  });

  // Vendor prefix detection: if original starts with webkit/moz/ms/o
  // followed by an uppercase letter, the result should have a leading dash
  if (/^(webkit|moz|ms|o)[A-Z]/.test(name)) {
    return '-' + kebab;
  }

  return kebab;
}

/**
 * Convert kebab-case to camelCase.
 * - `background-color` → `backgroundColor`
 * - `-webkit-transform` → `webkitTransform`
 */
export function kebabToCamel(name: string): string {
  // Strip leading dash for vendor prefixes
  const stripped = name.startsWith('-') ? name.slice(1) : name;
  return stripped.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

// ── Special property mappings ───────────────────────────────────────

/** JS property → CSS property for special cases */
const SPECIAL_JS_TO_CSS: Record<string, string> = {
  cssFloat: 'float',
};

/** CSS property → JS property for special cases */
const SPECIAL_CSS_TO_JS: Record<string, string> = {
  float: 'cssFloat',
};

function jsToCss(jsProp: string): string {
  if (SPECIAL_JS_TO_CSS[jsProp]) return SPECIAL_JS_TO_CSS[jsProp];
  return camelToKebab(jsProp);
}

function cssToJs(cssProp: string): string {
  if (SPECIAL_CSS_TO_JS[cssProp]) return SPECIAL_CSS_TO_JS[cssProp];
  return kebabToCamel(cssProp);
}

// ── Internal storage type ───────────────────────────────────────────

interface StyleEntry {
  value: string;
  priority: string;
}

// ── Known methods/properties on CSSStyleDeclaration ─────────────────
// These should NOT be intercepted by the Proxy as CSS property names.

const OWN_MEMBERS = new Set([
  'getPropertyValue',
  'setProperty',
  'removeProperty',
  'getPropertyPriority',
  'item',
  'length',
  'cssText',
  // Internal
  '_store',
  '_order',
  '_ownerElement',
  '_syncToElement',
  '_parseCssText',
  // Proxy/Object internals
  'constructor',
  'toString',
  'valueOf',
  'toJSON',
  'then', // Promise check
  Symbol.toPrimitive,
  Symbol.toStringTag,
  Symbol.iterator,
]);

// ── CSSStyleDeclaration class ───────────────────────────────────────

export interface ElementLike {
  setAttribute(name: string, value: string): void;
  getAttribute(name: string): string | null;
}

export class CSSStyleDeclaration {
  /** Internal property map: CSS property name → { value, priority } */
  _store: Map<string, StyleEntry> = new Map();

  /** Ordered list of property names for item() and length */
  _order: string[] = [];

  /** Optional owner element for syncing the style attribute */
  _ownerElement: ElementLike | null = null;

  constructor(initialCssText?: string, ownerElement?: ElementLike) {
    this._ownerElement = ownerElement ?? null;

    if (initialCssText) {
      this._parseCssText(initialCssText);
    }

    // Return a Proxy that intercepts camelCase property access
    return new Proxy(this, {
      get(target, prop, receiver) {
        // Let own members through to the real object
        if (typeof prop === 'symbol' || OWN_MEMBERS.has(prop as string)) {
          return Reflect.get(target, prop, receiver);
        }

        // Numeric index → item()
        if (typeof prop === 'string' && /^\d+$/.test(prop)) {
          return target.item(Number(prop));
        }

        // camelCase CSS property access
        if (typeof prop === 'string') {
          const cssProp = jsToCss(prop);
          return target.getPropertyValue(cssProp);
        }

        return Reflect.get(target, prop, receiver);
      },

      has(target, prop) {
        // Support 'in' operator for CSS feature detection
        // e.g., 'WebkitAnimation' in element.style
        if (typeof prop === 'symbol' || OWN_MEMBERS.has(prop as string)) {
          return prop in target;
        }
        // All CSS property names are considered valid
        if (typeof prop === 'string') return true;
        return prop in target;
      },

      set(target, prop, value, receiver) {
        // Let own members through
        if (typeof prop === 'symbol' || OWN_MEMBERS.has(prop as string)) {
          return Reflect.set(target, prop, value, receiver);
        }

        // camelCase CSS property setter
        if (typeof prop === 'string') {
          const cssProp = jsToCss(prop);
          if (value === '' || value === null || value === undefined) {
            target.removeProperty(cssProp);
          } else {
            target.setProperty(cssProp, String(value));
          }
          return true;
        }

        return Reflect.set(target, prop, value, receiver);
      },
    });
  }

  // ── length ──────────────────────────────────────────────────────────

  get length(): number {
    return this._order.length;
  }

  // ── cssText ─────────────────────────────────────────────────────────

  get cssText(): string {
    const parts: string[] = [];
    for (const prop of this._order) {
      const entry = this._store.get(prop);
      if (entry) {
        const important = entry.priority === 'important' ? ' !important' : '';
        parts.push(`${prop}: ${entry.value}${important}`);
      }
    }
    return parts.length > 0 ? parts.join('; ') + ';' : '';
  }

  set cssText(value: string) {
    // Clear everything
    this._store.clear();
    this._order = [];

    // Parse new value
    if (value) {
      this._parseCssText(value);
    }

    this._syncToElement();
  }

  // ── Methods ─────────────────────────────────────────────────────────

  getPropertyValue(property: string): string {
    const entry = this._store.get(property);
    return entry ? entry.value : '';
  }

  setProperty(property: string, value: string | null, priority?: string): void {
    // null or empty string → remove
    if (value === null || value === '') {
      this.removeProperty(property);
      return;
    }

    const normalizedPriority = priority === 'important' ? 'important' : '';

    const existing = this._store.has(property);
    this._store.set(property, {
      value: String(value),
      priority: normalizedPriority,
    });

    if (!existing) {
      this._order.push(property);
    }

    this._syncToElement();
  }

  removeProperty(property: string): string {
    const entry = this._store.get(property);
    if (!entry) return '';

    const oldValue = entry.value;
    this._store.delete(property);
    this._order = this._order.filter(p => p !== property);

    this._syncToElement();
    return oldValue;
  }

  getPropertyPriority(property: string): string {
    const entry = this._store.get(property);
    return entry ? entry.priority : '';
  }

  item(index: number): string {
    return this._order[index] ?? '';
  }

  // ── Internal helpers ────────────────────────────────────────────────

  /** Parse a CSS text string into the store */
  _parseCssText(cssText: string): void {
    // Split on semicolons, filter empty
    const declarations = cssText.split(';').filter(d => d.trim() !== '');

    for (const decl of declarations) {
      // Split on first colon only
      const colonIdx = decl.indexOf(':');
      if (colonIdx === -1) continue;

      const prop = decl.slice(0, colonIdx).trim();
      let val = decl.slice(colonIdx + 1).trim();

      // Check for !important
      let priority = '';
      const importantMatch = val.match(/\s*!important\s*$/i);
      if (importantMatch) {
        priority = 'important';
        val = val.slice(0, val.length - importantMatch[0].length).trim();
      }

      if (prop && val) {
        this._store.set(prop, { value: val, priority });
        if (!this._order.includes(prop)) {
          this._order.push(prop);
        }
      }
    }
  }

  /** Sync the current cssText back to the owner element's style attribute */
  _syncToElement(): void {
    if (!this._ownerElement) return;
    const text = this.cssText;
    if (text) {
      this._ownerElement.setAttribute('style', text);
    } else {
      // If no properties, set empty string (don't remove attribute —
      // that's a separate concern)
      this._ownerElement.setAttribute('style', '');
    }
  }
}
