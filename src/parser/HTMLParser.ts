/**
 * HTMLParser — parses HTML strings directly into a DOM tree.
 *
 * Uses a stack-based approach: opening tags push onto the stack,
 * closing tags pop. Void elements are auto-closed and never pushed.
 * Self-closing syntax on non-void elements is ignored per HTML spec.
 *
 * Optimized: single-pass parse (no intermediate token array),
 * direct node wiring bypasses appendChild overhead, charCodeAt
 * scanning, pre-computed void element Set.
 */

import { tokenize } from './HTMLTokenizer';
import { decodeEntities } from './HTMLTokenizer';
import type { Node } from '../nodes/Node';
import type { Document } from '../nodes/Document';

/** HTML void elements that cannot have children and need no closing tag. */
const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'source', 'track', 'wbr',
]);

export function isVoidElement(tagName: string): boolean {
  return VOID_ELEMENTS.has(tagName.toLowerCase());
}

// Character code constants
const CC_LT = 60;       // '<'
const CC_GT = 62;        // '>'
const CC_SLASH = 47;     // '/'
const CC_EXCL = 33;      // '!'
const CC_DASH = 45;      // '-'
const CC_EQ = 61;        // '='
const CC_SQUOTE = 39;    // "'"
const CC_DQUOTE = 34;    // '"'
const CC_SPACE = 32;     // ' '
const CC_TAB = 9;
const CC_LF = 10;
const CC_CR = 13;

function isWS(cc: number): boolean {
  return cc === CC_SPACE || cc === CC_TAB || cc === CC_LF || cc === CC_CR;
}

/**
 * Directly wire a child node into a parent's _children array.
 * Only safe for freshly-created nodes with no existing parent.
 */
function fastAppend(parent: Node, child: Node): void {
  const children = parent._children;
  const len = children.length;
  if (len > 0) {
    const last = children[len - 1];
    last.nextSibling = child;
    child.previousSibling = last;
  }
  child.parentNode = parent;
  children.push(child);
}

/**
 * Parse an HTML string into DOM nodes, using the given Document as factory.
 * Returns an array of top-level nodes.
 *
 * This is a single-pass parser that scans the HTML string directly
 * and builds DOM nodes inline, avoiding the intermediate token array.
 */
export function parseHTML(html: string, document: Document): Node[] {
  const result: Node[] = [];
  const len = html.length;
  if (len === 0) return result;

  const stack: Node[] = [];
  let stackLen = 0;
  let pos = 0;

  while (pos < len) {
    if (html.charCodeAt(pos) === CC_LT) {
      // Comment: <!-- ... -->
      if (pos + 3 < len &&
          html.charCodeAt(pos + 1) === CC_EXCL &&
          html.charCodeAt(pos + 2) === CC_DASH &&
          html.charCodeAt(pos + 3) === CC_DASH) {
        const endIdx = html.indexOf('-->', pos + 4);
        let data: string;
        if (endIdx === -1) {
          data = html.substring(pos + 4);
          pos = len;
        } else {
          data = html.substring(pos + 4, endIdx);
          pos = endIdx + 3;
        }
        const commentNode = document.createComment(data);
        if (stackLen > 0) {
          fastAppend(stack[stackLen - 1], commentNode);
        } else {
          result.push(commentNode);
        }
        continue;
      }

      // End tag: </tagName>
      if (pos + 1 < len && html.charCodeAt(pos + 1) === CC_SLASH) {
        const closeIdx = html.indexOf('>', pos + 2);
        if (closeIdx === -1) {
          // Malformed — treat rest as text
          const textNode = document.createTextNode(html.substring(pos));
          if (stackLen > 0) {
            fastAppend(stack[stackLen - 1], textNode);
          } else {
            result.push(textNode);
          }
          pos = len;
        } else {
          // Extract tag name with inline trim
          let nameStart = pos + 2;
          let nameEnd = closeIdx;
          while (nameStart < nameEnd && isWS(html.charCodeAt(nameStart))) nameStart++;
          while (nameEnd > nameStart && isWS(html.charCodeAt(nameEnd - 1))) nameEnd--;
          const tagName = html.substring(nameStart, nameEnd).toUpperCase();

          // Find matching open tag on the stack
          let found = -1;
          for (let i = stackLen - 1; i >= 0; i--) {
            if ((stack[i] as any).tagName === tagName) {
              found = i;
              break;
            }
          }
          if (found !== -1) {
            stackLen = found;
          }
          pos = closeIdx + 1;
        }
        continue;
      }

      // Start tag: <tagName ...>
      const tagEnd = findTagEnd(html, pos + 1, len);
      if (tagEnd === -1) {
        // Malformed — treat as text
        const textNode = document.createTextNode(html.substring(pos));
        if (stackLen > 0) {
          fastAppend(stack[stackLen - 1], textNode);
        } else {
          result.push(textNode);
        }
        pos = len;
        continue;
      }

      // Parse start tag inline
      let contentEnd = tagEnd;
      const selfClosing = html.charCodeAt(tagEnd - 1) === CC_SLASH;
      if (selfClosing) contentEnd = tagEnd - 1;

      // Extract tag name
      let p = pos + 1;
      while (p < contentEnd && isWS(html.charCodeAt(p))) p++;
      const nameStart = p;
      while (p < contentEnd) {
        const cc = html.charCodeAt(p);
        if (isWS(cc) || cc === CC_SLASH) break;
        p++;
      }
      const tagNameLower = html.substring(nameStart, p).toLowerCase();
      const el = document.createElement(tagNameLower);

      // Parse attributes — use _setAttributeFast since element is freshly created
      let hasId = false;
      let idValue = '';
      while (p < contentEnd) {
        // Skip whitespace
        while (p < contentEnd && isWS(html.charCodeAt(p))) p++;
        if (p >= contentEnd) break;

        // Attribute name
        const attrNameStart = p;
        while (p < contentEnd) {
          const cc = html.charCodeAt(p);
          if (cc === CC_EQ || isWS(cc) || cc === CC_SLASH) break;
          p++;
        }
        if (p === attrNameStart) break;
        const attrName = html.substring(attrNameStart, p).toLowerCase();

        // Skip whitespace after name
        while (p < contentEnd && isWS(html.charCodeAt(p))) p++;

        // Check for '='
        if (p >= contentEnd || html.charCodeAt(p) !== CC_EQ) {
          el._setAttributeFast(attrName, '');
          continue;
        }
        p++; // skip '='

        // Skip whitespace after '='
        while (p < contentEnd && isWS(html.charCodeAt(p))) p++;

        if (p >= contentEnd) {
          el._setAttributeFast(attrName, '');
          break;
        }

        // Parse value
        let attrValue: string;
        const firstChar = html.charCodeAt(p);
        if (firstChar === CC_DQUOTE || firstChar === CC_SQUOTE) {
          p++; // skip opening quote
          const valStart = p;
          while (p < contentEnd && html.charCodeAt(p) !== firstChar) p++;
          const rawValue = html.substring(valStart, p);
          attrValue = decodeEntities(rawValue);
          if (p < contentEnd) p++; // skip closing quote
        } else {
          const valStart = p;
          while (p < contentEnd && !isWS(html.charCodeAt(p))) p++;
          const rawValue = html.substring(valStart, p);
          attrValue = decodeEntities(rawValue);
        }
        el._setAttributeFast(attrName, attrValue);

        // Track id for index registration
        if (attrName === 'id' && attrValue) {
          hasId = true;
          idValue = attrValue;
        }
      }

      // Register id in document index if present
      if (hasId) {
        const doc = el.ownerDocument;
        if (doc && doc._idIndex && !doc._idIndex.has(idValue)) {
          doc._idIndex.set(idValue, el);
        }
      }

      // Append to parent or result
      if (stackLen > 0) {
        fastAppend(stack[stackLen - 1], el);
      } else {
        result.push(el);
      }

      // Raw-text elements (<script>, <style>): switch to raw-text mode.
      // Scan character-by-character for the matching close tag without
      // interpreting '<' as a new tag boundary (HTML spec §8.2.4).
      if (tagNameLower === 'script' || tagNameLower === 'style') {
        const closePat = '</' + tagNameLower;
        const rawStart = tagEnd + 1;
        // Case-insensitive search for the close tag
        const htmlLower = html.toLowerCase();
        const rawEnd = htmlLower.indexOf(closePat, rawStart);
        const textEnd = rawEnd === -1 ? len : rawEnd;
        const rawText = html.substring(rawStart, textEnd);
        if (rawText) {
          fastAppend(el, document.createTextNode(rawText));
        }
        if (rawEnd !== -1) {
          // Skip to after '>' of the close tag (e.g. </script>)
          const closeTagGt = html.indexOf('>', rawEnd);
          pos = closeTagGt !== -1 ? closeTagGt + 1 : len;
        } else {
          pos = len;
        }
        // Do NOT push raw-text element onto stack — content is fully consumed
        continue;
      }

      // Void elements are self-closing — don't push onto stack
      if (!VOID_ELEMENTS.has(tagNameLower)) {
        stack[stackLen] = el;
        stackLen++;
      }

      pos = tagEnd + 1;
      continue;
    }

    // Text content — consume until next '<'
    const nextTag = html.indexOf('<', pos);
    const textEnd = nextTag === -1 ? len : nextTag;
    if (textEnd > pos) {
      const text = html.substring(pos, textEnd);
      const textNode = document.createTextNode(decodeEntities(text));
      if (stackLen > 0) {
        fastAppend(stack[stackLen - 1], textNode);
      } else {
        result.push(textNode);
      }
    }
    pos = textEnd;
  }

  return result;
}

/**
 * Find the closing '>' of a tag, respecting quoted attribute values.
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
