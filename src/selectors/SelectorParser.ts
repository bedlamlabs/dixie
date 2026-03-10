/**
 * SelectorParser — parses a CSS selector string into a structured AST.
 *
 * Supports:
 * - Type selectors (div, span)
 * - Class selectors (.foo)
 * - ID selectors (#bar)
 * - Universal selector (*)
 * - Attribute selectors ([attr], [attr=val], [attr~=val], [attr|=val],
 *   [attr^=val], [attr$=val], [attr*=val])
 * - Pseudo-class selectors (:first-child, :nth-child(2n+1), :not(.foo), etc.)
 * - Compound selectors (div.foo#bar[attr=val]:first-child)
 * - Selector lists (a, b)
 * - Descendant combinator (space)
 * - Child combinator (>)
 * - Adjacent sibling combinator (+)
 * - General sibling combinator (~)
 */

// ── AST Types ─────────────────────────────────────────────────────────

export type SimpleSelector =
  | { type: 'type'; name: string }
  | { type: 'class'; name: string }
  | { type: 'id'; name: string }
  | { type: 'universal' }
  | { type: 'attribute'; name: string; operator: AttributeOperator | null; value: string | null }
  | { type: 'pseudo'; name: string; argument: string | null }
  | { type: 'pseudoNot'; innerSelectors: SimpleSelector[] };

export type AttributeOperator = '=' | '~=' | '|=' | '^=' | '$=' | '*=';

/** A compound selector is a sequence of simple selectors that must all match the same element. */
export interface CompoundSelector {
  selectors: SimpleSelector[];
}

export type Combinator = 'descendant' | 'child' | 'adjacentSibling' | 'generalSibling';

/** A complex selector is a chain of compound selectors connected by combinators. */
export interface ComplexSelector {
  head: CompoundSelector;
  tail: Array<{ combinator: Combinator; selector: CompoundSelector }>;
}

/** The top-level AST: a list of complex selectors (comma-separated). */
export interface SelectorList {
  selectors: ComplexSelector[];
}

// ── Parse Cache ──────────────────────────────────────────────────────

const PARSE_CACHE_MAX = 128;
const parseCache = new Map<string, SelectorList>();

/** Clear the selector parse cache (useful for testing). */
export function clearSelectorCache(): void {
  parseCache.clear();
}

// ── Parser ────────────────────────────────────────────────────────────

export function parseSelector(input: string): SelectorList {
  const trimmed = input.trim();

  // Check cache first
  const cached = parseCache.get(trimmed);
  if (cached) return cached;

  const parser = new SelectorParserImpl(trimmed);
  const result = parser.parseSelectorList();

  // Evict oldest entries if cache is full
  if (parseCache.size >= PARSE_CACHE_MAX) {
    // Delete the first (oldest) entry
    const firstKey = parseCache.keys().next().value;
    if (firstKey !== undefined) parseCache.delete(firstKey);
  }
  parseCache.set(trimmed, result);

  return result;
}

class SelectorParserImpl {
  private input: string;
  private pos: number = 0;

  constructor(input: string) {
    this.input = input;
  }

  parseSelectorList(): SelectorList {
    if (this.input.length === 0) {
      throw new DOMException(
        "Failed to execute 'querySelector': '' is not a valid selector.",
        'SyntaxError',
      );
    }

    const selectors: ComplexSelector[] = [];
    selectors.push(this.parseComplexSelector());

    while (this.pos < this.input.length && this.peek() === ',') {
      this.advance(); // skip ','
      this.skipWhitespace();
      if (this.pos >= this.input.length) {
        throw new DOMException(
          "Failed to execute 'querySelector': unexpected end of selector after ','.",
          'SyntaxError',
        );
      }
      selectors.push(this.parseComplexSelector());
    }

    if (this.pos < this.input.length) {
      throw new DOMException(
        `Failed to execute 'querySelector': '${this.input}' is not a valid selector.`,
        'SyntaxError',
      );
    }

    return { selectors };
  }

  private parseComplexSelector(): ComplexSelector {
    this.skipWhitespace();
    const head = this.parseCompoundSelector();
    const tail: Array<{ combinator: Combinator; selector: CompoundSelector }> = [];

    while (this.pos < this.input.length) {
      const beforeWs = this.pos;
      this.skipWhitespace();
      const hasWhitespace = this.pos > beforeWs;

      if (this.pos >= this.input.length || this.peek() === ',') {
        break;
      }

      let combinator: Combinator;
      if (this.peek() === '>') {
        this.advance();
        this.skipWhitespace();
        combinator = 'child';
      } else if (this.peek() === '+') {
        this.advance();
        this.skipWhitespace();
        combinator = 'adjacentSibling';
      } else if (this.peek() === '~') {
        this.advance();
        this.skipWhitespace();
        combinator = 'generalSibling';
      } else if (hasWhitespace) {
        combinator = 'descendant';
      } else {
        // No combinator and no whitespace — end of this complex selector
        break;
      }

      if (this.pos >= this.input.length || this.peek() === ',') {
        throw new DOMException(
          `Failed to execute 'querySelector': '${this.input}' is not a valid selector.`,
          'SyntaxError',
        );
      }

      const selector = this.parseCompoundSelector();
      tail.push({ combinator, selector });
    }

    return { head, tail };
  }

  private parseCompoundSelector(): CompoundSelector {
    const selectors: SimpleSelector[] = [];

    while (this.pos < this.input.length) {
      const ch = this.peek();

      if (ch === '#') {
        this.advance();
        const name = this.readIdent();
        selectors.push({ type: 'id', name });
      } else if (ch === '.') {
        this.advance();
        const name = this.readIdent();
        selectors.push({ type: 'class', name });
      } else if (ch === '[') {
        selectors.push(this.parseAttributeSelector());
      } else if (ch === ':') {
        selectors.push(this.parsePseudoClassSelector());
      } else if (ch === '*') {
        this.advance();
        selectors.push({ type: 'universal' });
      } else if (this.isIdentStart(ch)) {
        const name = this.readIdent();
        selectors.push({ type: 'type', name });
      } else {
        break;
      }
    }

    if (selectors.length === 0) {
      throw new DOMException(
        `Failed to execute 'querySelector': '${this.input}' is not a valid selector.`,
        'SyntaxError',
      );
    }

    return { selectors };
  }

  private parseAttributeSelector(): SimpleSelector {
    this.advance(); // skip '['
    this.skipWhitespace();

    const name = this.readIdent();
    this.skipWhitespace();

    if (this.peek() === ']') {
      this.advance();
      return { type: 'attribute', name, operator: null, value: null };
    }

    // Read operator
    let operator: AttributeOperator;
    const ch = this.peek();
    if (ch === '=') {
      operator = '=';
      this.advance();
    } else if (ch === '~' || ch === '|' || ch === '^' || ch === '$' || ch === '*') {
      this.advance();
      if (this.peek() !== '=') {
        throw new DOMException(
          `Failed to execute 'querySelector': '${this.input}' is not a valid selector.`,
          'SyntaxError',
        );
      }
      this.advance();
      operator = (ch + '=') as AttributeOperator;
    } else {
      throw new DOMException(
        `Failed to execute 'querySelector': '${this.input}' is not a valid selector.`,
        'SyntaxError',
      );
    }

    this.skipWhitespace();

    // Read value (quoted or unquoted).
    // Unquoted values may start with a digit (e.g. [data-index=1]) — use
    // readUnquotedValue() which accepts any non-whitespace, non-] sequence.
    let value: string;
    if (this.peek() === '"' || this.peek() === "'") {
      value = this.readQuotedString();
    } else {
      value = this.readUnquotedValue();
    }

    this.skipWhitespace();

    if (this.peek() !== ']') {
      throw new DOMException(
        `Failed to execute 'querySelector': '${this.input}' is not a valid selector.`,
        'SyntaxError',
      );
    }
    this.advance(); // skip ']'

    return { type: 'attribute', name, operator, value };
  }

  // ── Pseudo-class parsing ─────────────────────────────────────────

  private parsePseudoClassSelector(): SimpleSelector {
    this.advance(); // skip ':'

    // Read pseudo-class name
    const name = this.readIdent();

    // Check for functional pseudo-class (with parentheses)
    if (this.pos < this.input.length && this.peek() === '(') {
      this.advance(); // skip '('
      this.skipWhitespace();

      if (name === 'not') {
        // :not() — parse inner compound selector (simple selectors only)
        const innerSelectors: SimpleSelector[] = [];
        while (this.pos < this.input.length && this.peek() !== ')') {
          const ch = this.peek();
          if (ch === '#') {
            this.advance();
            const ident = this.readIdent();
            innerSelectors.push({ type: 'id', name: ident });
          } else if (ch === '.') {
            this.advance();
            const ident = this.readIdent();
            innerSelectors.push({ type: 'class', name: ident });
          } else if (ch === '[') {
            innerSelectors.push(this.parseAttributeSelector());
          } else if (ch === ':') {
            innerSelectors.push(this.parsePseudoClassSelector());
          } else if (ch === '*') {
            this.advance();
            innerSelectors.push({ type: 'universal' });
          } else if (this.isIdentStart(ch)) {
            const ident = this.readIdent();
            innerSelectors.push({ type: 'type', name: ident });
          } else {
            break;
          }
        }

        if (this.peek() !== ')') {
          throw new DOMException(
            `Failed to execute 'querySelector': '${this.input}' is not a valid selector (unclosed :not).`,
            'SyntaxError',
          );
        }
        this.advance(); // skip ')'

        if (innerSelectors.length === 0) {
          throw new DOMException(
            `Failed to execute 'querySelector': ':not()' requires an argument.`,
            'SyntaxError',
          );
        }

        return { type: 'pseudoNot', innerSelectors };
      }

      // Other functional pseudo-classes: :nth-child(), :nth-last-child(), etc.
      // Read the argument as a raw string up to the closing paren
      let argument = '';
      let depth = 1;
      while (this.pos < this.input.length && depth > 0) {
        const ch = this.peek();
        if (ch === '(') depth++;
        else if (ch === ')') {
          depth--;
          if (depth === 0) break;
        }
        argument += ch;
        this.advance();
      }

      if (this.peek() !== ')') {
        throw new DOMException(
          `Failed to execute 'querySelector': '${this.input}' is not a valid selector (unclosed function).`,
          'SyntaxError',
        );
      }
      this.advance(); // skip ')'

      return { type: 'pseudo', name, argument: argument.trim() };
    }

    // Non-functional pseudo-class
    return { type: 'pseudo', name, argument: null };
  }

  // ── Low-level helpers ─────────────────────────────────────────────

  private peek(): string {
    return this.input[this.pos] ?? '';
  }

  private advance(): void {
    this.pos++;
  }

  private skipWhitespace(): void {
    while (this.pos < this.input.length && /\s/.test(this.input[this.pos])) {
      this.pos++;
    }
  }

  private isIdentStart(ch: string): boolean {
    return /[a-zA-Z_\-]/.test(ch) || ch.charCodeAt(0) > 127;
  }

  private isIdentChar(ch: string): boolean {
    return /[a-zA-Z0-9_\-]/.test(ch) || ch.charCodeAt(0) > 127;
  }

  /**
   * Read an unquoted attribute value — accepts digit-starting sequences like `1`, `123`, `2rem`.
   * CSS4 allows any sequence of non-whitespace, non-] characters as an unquoted value.
   */
  private readUnquotedValue(): string {
    const start = this.pos;
    while (this.pos < this.input.length) {
      const ch = this.input[this.pos];
      if (ch === ']' || ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') break;
      this.pos++;
    }
    if (this.pos === start) {
      throw new DOMException(
        `Failed to execute 'querySelector': '${this.input}' is not a valid selector.`,
        'SyntaxError',
      );
    }
    return this.input.slice(start, this.pos);
  }

  private readIdent(): string {
    const start = this.pos;
    if (this.pos >= this.input.length || !this.isIdentStart(this.peek())) {
      throw new DOMException(
        `Failed to execute 'querySelector': '${this.input}' is not a valid selector.`,
        'SyntaxError',
      );
    }
    while (this.pos < this.input.length && this.isIdentChar(this.input[this.pos])) {
      this.pos++;
    }
    return this.input.slice(start, this.pos);
  }

  private readQuotedString(): string {
    const quote = this.peek();
    this.advance(); // skip opening quote
    let value = '';
    while (this.pos < this.input.length && this.input[this.pos] !== quote) {
      if (this.input[this.pos] === '\\') {
        this.advance();
        if (this.pos < this.input.length) {
          value += this.input[this.pos];
          this.advance();
        }
      } else {
        value += this.input[this.pos];
        this.advance();
      }
    }
    if (this.pos >= this.input.length) {
      throw new DOMException(
        `Failed to execute 'querySelector': unterminated string in selector.`,
        'SyntaxError',
      );
    }
    this.advance(); // skip closing quote
    return value;
  }
}
