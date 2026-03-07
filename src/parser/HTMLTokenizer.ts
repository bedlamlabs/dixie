/**
 * HTMLTokenizer — converts an HTML string into a stream of tokens.
 *
 * Token types:
 * - StartTag: opening tag with name, attributes, and self-closing flag
 * - EndTag: closing tag with name
 * - Text: character data between tags
 * - Comment: HTML comment content (without the <!-- --> delimiters)
 *
 * Optimized for speed: index-based scanning, no regex in hot paths,
 * fast entity decoding with early-exit, minimal string allocations.
 */

export interface Attribute {
  name: string;
  value: string;
}

export interface StartTagToken {
  type: 'StartTag';
  tagName: string;
  attributes: Attribute[];
  selfClosing: boolean;
}

export interface EndTagToken {
  type: 'EndTag';
  tagName: string;
}

export interface TextToken {
  type: 'Text';
  data: string;
}

export interface CommentToken {
  type: 'Comment';
  data: string;
}

export type Token = StartTagToken | EndTagToken | TextToken | CommentToken;

/** Named character references we support. */
const ENTITIES: Record<string, string> = {
  'amp': '&',
  'lt': '<',
  'gt': '>',
  'quot': '"',
  'apos': "'",
  'nbsp': '\u00A0',
  'AMP': '&',
  'LT': '<',
  'GT': '>',
  'QUOT': '"',
  'APOS': "'",
  'NBSP': '\u00A0',
  'Amp': '&',
  'Lt': '<',
  'Gt': '>',
  'Quot': '"',
  'Apos': "'",
  'Nbsp': '\u00A0',
};

/**
 * Decode HTML entities in a string.
 * Handles &amp; &lt; &gt; &quot; &#39; &#xNN; &#NNN;
 * Fast path: skip entirely if no '&' present.
 */
export function decodeEntities(text: string): string {
  // Fast path: no entities to decode
  if (text.indexOf('&') === -1) return text;

  let result = '';
  let lastIdx = 0;
  const len = text.length;

  for (let i = 0; i < len; i++) {
    if (text.charCodeAt(i) !== 38) continue; // '&' = 38

    // Found '&' — look for ';'
    const semiIdx = text.indexOf(';', i + 1);
    if (semiIdx === -1 || semiIdx - i > 10) {
      // No semicolon nearby — not an entity
      continue;
    }

    const entityBody = text.substring(i + 1, semiIdx);
    let decoded: string | undefined;

    if (entityBody.charCodeAt(0) === 35) { // '#'
      if (entityBody.charCodeAt(1) === 120 || entityBody.charCodeAt(1) === 88) { // 'x' or 'X'
        // Hex numeric entity: &#xNN;
        const code = parseInt(entityBody.substring(2), 16);
        if (!isNaN(code)) decoded = String.fromCodePoint(code);
      } else {
        // Decimal numeric entity: &#NNN;
        const code = parseInt(entityBody.substring(1), 10);
        if (!isNaN(code)) decoded = String.fromCodePoint(code);
      }
    } else {
      // Named entity — try direct lookup first, then lowercase
      decoded = ENTITIES[entityBody];
      if (decoded === undefined) {
        const lower = entityBody.toLowerCase();
        decoded = ENTITIES[lower];
      }
    }

    if (decoded !== undefined) {
      result += text.substring(lastIdx, i) + decoded;
      lastIdx = semiIdx + 1;
      i = semiIdx; // loop will increment
    }
  }

  if (lastIdx === 0) return text; // No entities were decoded
  return result + text.substring(lastIdx);
}

// Character code constants for fast comparison
const CC_LT = 60;       // '<'
const CC_GT = 62;        // '>'
const CC_SLASH = 47;     // '/'
const CC_EXCL = 33;      // '!'
const CC_DASH = 45;      // '-'
const CC_EQ = 61;        // '='
const CC_SQUOTE = 39;    // "'"
const CC_DQUOTE = 34;    // '"'
const CC_SPACE = 32;     // ' '
const CC_TAB = 9;        // '\t'
const CC_LF = 10;        // '\n'
const CC_CR = 13;        // '\r'

function isWhitespace(cc: number): boolean {
  return cc === CC_SPACE || cc === CC_TAB || cc === CC_LF || cc === CC_CR;
}

/**
 * Tokenize an HTML string into a sequence of tokens.
 * Optimized: index-based scanning, no regex, minimal allocations.
 */
export function tokenize(html: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  const len = html.length;

  while (pos < len) {
    if (html.charCodeAt(pos) === CC_LT) {
      // Comment: <!-- ... -->
      if (pos + 3 < len &&
          html.charCodeAt(pos + 1) === CC_EXCL &&
          html.charCodeAt(pos + 2) === CC_DASH &&
          html.charCodeAt(pos + 3) === CC_DASH) {
        const endIdx = html.indexOf('-->', pos + 4);
        if (endIdx === -1) {
          tokens.push({ type: 'Comment', data: html.substring(pos + 4) });
          pos = len;
        } else {
          tokens.push({ type: 'Comment', data: html.substring(pos + 4, endIdx) });
          pos = endIdx + 3;
        }
        continue;
      }

      // End tag: </tagName>
      if (pos + 1 < len && html.charCodeAt(pos + 1) === CC_SLASH) {
        const closeIdx = html.indexOf('>', pos + 2);
        if (closeIdx === -1) {
          tokens.push({ type: 'Text', data: html.substring(pos) });
          pos = len;
        } else {
          // Extract and trim tag name — manual trim to avoid substring + trim overhead
          let nameStart = pos + 2;
          let nameEnd = closeIdx;
          // Skip leading whitespace
          while (nameStart < nameEnd && isWhitespace(html.charCodeAt(nameStart))) nameStart++;
          // Skip trailing whitespace
          while (nameEnd > nameStart && isWhitespace(html.charCodeAt(nameEnd - 1))) nameEnd--;
          tokens.push({ type: 'EndTag', tagName: html.substring(nameStart, nameEnd).toLowerCase() });
          pos = closeIdx + 1;
        }
        continue;
      }

      // Start tag: <tagName ...>
      const tagEnd = findTagEnd(html, pos + 1, len);
      if (tagEnd === -1) {
        tokens.push({ type: 'Text', data: html.substring(pos) });
        pos = len;
        continue;
      }

      // Parse tag content inline — no intermediate substring for the whole content
      parseStartTag(html, pos + 1, tagEnd, tokens);
      pos = tagEnd + 1;
      continue;
    }

    // Text content — consume until next '<'
    const nextTag = html.indexOf('<', pos);
    const textEnd = nextTag === -1 ? len : nextTag;
    if (textEnd > pos) {
      const text = html.substring(pos, textEnd);
      tokens.push({ type: 'Text', data: decodeEntities(text) });
    }
    pos = textEnd;
  }

  return tokens;
}

/**
 * Find the closing '>' of a tag, respecting quoted attribute values.
 * Optimized: uses charCodeAt instead of string indexing.
 */
function findTagEnd(html: string, start: number, len: number): number {
  let inSingle = false;
  let inDouble = false;

  for (let i = start; i < len; i++) {
    const cc = html.charCodeAt(i);
    if (cc === CC_SQUOTE && !inDouble) {
      inSingle = !inSingle;
    } else if (cc === CC_DQUOTE && !inSingle) {
      inDouble = !inDouble;
    } else if (cc === CC_GT && !inSingle && !inDouble) {
      return i;
    }
  }
  return -1;
}

/**
 * Parse a start tag directly from indices in the HTML string.
 * Avoids creating the full tag content substring.
 * Pushes the parsed StartTagToken directly onto the tokens array.
 */
function parseStartTag(html: string, start: number, end: number, tokens: Token[]): void {
  // Check for self-closing: last char before '>' is '/'
  let contentEnd = end;
  const selfClosing = html.charCodeAt(end - 1) === CC_SLASH;
  if (selfClosing) contentEnd = end - 1;

  // Skip leading whitespace
  let pos = start;
  while (pos < contentEnd && isWhitespace(html.charCodeAt(pos))) pos++;

  // Extract tag name — scan until whitespace or '/' or end
  const nameStart = pos;
  while (pos < contentEnd) {
    const cc = html.charCodeAt(pos);
    if (isWhitespace(cc) || cc === CC_SLASH) break;
    pos++;
  }
  const tagName = html.substring(nameStart, pos).toLowerCase();

  // No attributes — fast path
  if (pos >= contentEnd) {
    tokens.push({
      type: 'StartTag',
      tagName,
      attributes: [],
      selfClosing,
    });
    return;
  }

  // Parse attributes directly from the html string
  const attributes: Attribute[] = [];

  while (pos < contentEnd) {
    // Skip whitespace
    while (pos < contentEnd && isWhitespace(html.charCodeAt(pos))) pos++;
    if (pos >= contentEnd) break;

    // Extract attribute name
    const attrNameStart = pos;
    while (pos < contentEnd) {
      const cc = html.charCodeAt(pos);
      if (cc === CC_EQ || isWhitespace(cc) || cc === CC_SLASH) break;
      pos++;
    }
    if (pos === attrNameStart) break; // No name found — safety

    const attrName = html.substring(attrNameStart, pos).toLowerCase();

    // Skip whitespace after name
    while (pos < contentEnd && isWhitespace(html.charCodeAt(pos))) pos++;

    // Check for '='
    if (pos >= contentEnd || html.charCodeAt(pos) !== CC_EQ) {
      // Boolean attribute
      attributes.push({ name: attrName, value: '' });
      continue;
    }

    pos++; // skip '='

    // Skip whitespace after '='
    while (pos < contentEnd && isWhitespace(html.charCodeAt(pos))) pos++;

    if (pos >= contentEnd) {
      attributes.push({ name: attrName, value: '' });
      break;
    }

    // Parse value
    const firstChar = html.charCodeAt(pos);
    if (firstChar === CC_DQUOTE || firstChar === CC_SQUOTE) {
      // Quoted value
      const quote = firstChar;
      pos++; // skip opening quote
      const valStart = pos;
      while (pos < contentEnd && html.charCodeAt(pos) !== quote) pos++;
      const rawValue = html.substring(valStart, pos);
      attributes.push({ name: attrName, value: decodeEntities(rawValue) });
      if (pos < contentEnd) pos++; // skip closing quote
    } else {
      // Unquoted value — until whitespace
      const valStart = pos;
      while (pos < contentEnd && !isWhitespace(html.charCodeAt(pos))) pos++;
      const rawValue = html.substring(valStart, pos);
      attributes.push({ name: attrName, value: decodeEntities(rawValue) });
    }
  }

  tokens.push({
    type: 'StartTag',
    tagName,
    attributes,
    selfClosing,
  });
}
