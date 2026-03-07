/**
 * HTMLSerializer — converts a DOM subtree back to an HTML string.
 *
 * Handles Element nodes (with attributes), Text nodes (with entity
 * escaping), Comment nodes, and void elements (no closing tag).
 */

import { Node } from '../nodes/Node';
import { isVoidElement } from './HTMLParser';

/**
 * Escape special characters in text content for safe HTML output.
 */
function escapeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Escape special characters in attribute values.
 */
function escapeAttrValue(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Serialize a single node and its descendants to an HTML string.
 */
export function serializeHTML(node: Node): string {
  switch (node.nodeType) {
    case Node.TEXT_NODE:
      return escapeText(node._textData ?? '');

    case Node.COMMENT_NODE:
      return `<!--${node._textData ?? ''}-->`;

    case Node.ELEMENT_NODE:
      return serializeElement(node);

    case Node.DOCUMENT_FRAGMENT_NODE:
      return serializeChildren(node);

    case Node.DOCUMENT_NODE:
      return serializeChildren(node);

    default:
      return '';
  }
}

/**
 * Serialize an Element node to HTML.
 */
function serializeElement(node: Node): string {
  const el = node as any; // Element type — avoid circular import
  const tagName = el.tagName.toLowerCase();

  // Opening tag
  let html = `<${tagName}`;

  // Attributes
  const attrs = el.attributes;
  for (let i = 0; i < attrs.length; i++) {
    const attr = attrs.item(i);
    if (attr) {
      if (attr.value === '') {
        html += ` ${attr.name}`;
      } else {
        html += ` ${attr.name}="${escapeAttrValue(attr.value)}"`;
      }
    }
  }

  html += '>';

  // Void elements have no closing tag and no children
  if (isVoidElement(tagName)) {
    return html;
  }

  // Children
  html += serializeChildren(node);

  // Closing tag
  html += `</${tagName}>`;

  return html;
}

/**
 * Serialize all children of a node.
 */
function serializeChildren(node: Node): string {
  let html = '';
  for (const child of node._children) {
    html += serializeHTML(child);
  }
  return html;
}
