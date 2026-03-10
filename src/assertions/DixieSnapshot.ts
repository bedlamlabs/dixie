/**
 * DixieSnapshot — structured DOM output for agent consumption.
 *
 * Provides three output modes:
 *  - toJSON(): Full DOM state as structured data
 *  - toDebugString(): Human/agent-readable indented tree visualization
 *  - toSummary(): Quick numeric summary of page contents
 */

import type { Document } from '../nodes/Document';
import { Node } from '../nodes/Node';
import type { Element } from '../nodes/Element';

// ── Output interfaces ─────────────────────────────────────────────────

export interface DOMState {
  url: string;
  title: string;
  bodyHTML: string;
  bodyText: string;
  elementCount: number;
  forms: FormSummary[];
  links: LinkSummary[];
  headings: HeadingSummary[];
  images: ImageSummary[];
}

export interface PageSummary {
  title: string;
  elementCount: number;
  textLength: number;
  formCount: number;
  linkCount: number;
  headingCount: number;
  hasContent: boolean;
}

export interface FormSummary {
  action: string;
  method: string;
  fieldCount: number;
}

export interface LinkSummary {
  href: string;
  text: string;
}

export interface HeadingSummary {
  level: number;
  text: string;
}

export interface ImageSummary {
  src: string;
  alt: string;
}

// ── Key attributes to show in debug output ────────────────────────────

const KEY_ATTRIBUTES = ['id', 'class', 'type', 'name', 'href', 'src', 'action', 'method', 'value', 'for'];
const HEADING_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6']);

// ── DixieSnapshot ─────────────────────────────────────────────────────

export class DixieSnapshot {
  private doc: Document;

  constructor(document: Document) {
    this.doc = document;
  }

  /**
   * Full DOM state as structured data.
   * Optimized: single-pass tree walk collects all element types at once.
   */
  toJSON(): DOMState {
    const body = this.doc.body;
    const bodyHTML = body ? body.innerHTML : '';
    const bodyText = body ? body.textContent.trim() : '';

    const collected = this._collectAll(body);

    return {
      url: '',
      title: this.doc.title,
      bodyHTML,
      bodyText,
      elementCount: collected.elementCount,
      forms: collected.forms,
      links: collected.links,
      headings: collected.headings,
      images: collected.images,
    };
  }

  /**
   * Human/agent-readable indented tree visualization.
   * Optimized: pre-computed indent strings, array buffer with final join.
   */
  toDebugString(maxDepth: number = 10): string {
    const lines: string[] = [];
    // Pre-compute indent strings up to maxDepth
    const indents: string[] = new Array(maxDepth + 2);
    for (let i = 0; i <= maxDepth + 1; i++) {
      indents[i] = '  '.repeat(i);
    }
    this._renderNode(this.doc.documentElement, 0, maxDepth, lines, indents);
    return lines.join('\n');
  }

  /**
   * Quick numeric summary of page contents.
   * Optimized: single-pass walk counts elements by tag instead of building full arrays.
   */
  toSummary(): PageSummary {
    const body = this.doc.body;
    const bodyText = body ? body.textContent.trim() : '';

    const counts = this._countAll(body);

    return {
      title: this.doc.title,
      elementCount: counts.elementCount,
      textLength: bodyText.length,
      formCount: counts.formCount,
      linkCount: counts.linkCount,
      headingCount: counts.headingCount,
      hasContent: bodyText.length > 0,
    };
  }

  // ── Private: tree rendering ─────────────────────────────────────────

  private _renderNode(node: Node, depth: number, maxDepth: number, lines: string[], indents: string[]): void {
    if (depth > maxDepth) return;

    const indent = indents[depth] ?? '  '.repeat(depth);

    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node._textData ?? '').trim();
      if (text.length > 0) {
        const truncated = text.length > 80 ? text.substring(0, 80) + '...' : text;
        lines.push(indent + truncated);
      }
      return;
    }

    if (node.nodeType === Node.COMMENT_NODE) {
      lines.push(indent + '<!--' + (node._textData ?? '') + '-->');
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tag = el.tagName.toLowerCase();

      // Build attribute string with key attributes
      let attrStr = '';
      for (let i = 0; i < KEY_ATTRIBUTES.length; i++) {
        const val = el.getAttribute(KEY_ATTRIBUTES[i]);
        if (val !== null) {
          attrStr += ' ' + KEY_ATTRIBUTES[i] + '="' + val + '"';
        }
      }

      lines.push(indent + '<' + tag + attrStr + '>');

      // Recurse into children
      const children = node._children;
      for (let i = 0; i < children.length; i++) {
        this._renderNode(children[i], depth + 1, maxDepth, lines, indents);
      }

      return;
    }

    // Document node — just recurse
    const children = node._children;
    for (let i = 0; i < children.length; i++) {
      this._renderNode(children[i], depth, maxDepth, lines, indents);
    }
  }

  // ── Private: Single-pass collectors ─────────────────────────────────

  /** Tags that count as form fields */
  private static readonly FIELD_TAGS = new Set(['INPUT', 'SELECT', 'TEXTAREA']);

  /**
   * Single-pass tree walk that collects forms, links, headings, images,
   * and element count all at once. Replaces 5 separate walks.
   */
  private _collectAll(root: Node | null): {
    elementCount: number;
    forms: FormSummary[];
    links: LinkSummary[];
    headings: HeadingSummary[];
    images: ImageSummary[];
  } {
    if (!root) {
      return { elementCount: 0, forms: [], links: [], headings: [], images: [] };
    }

    const forms: FormSummary[] = [];
    const links: LinkSummary[] = [];
    const headings: HeadingSummary[] = [];
    const images: ImageSummary[] = [];
    let elementCount = 0;

    // Track which form each element belongs to for field counting
    // We do a single walk and track form context via a post-pass
    // Actually, forms need field counts from their descendants.
    // We'll collect form elements and their positions, then count fields in a second mini-walk.
    const formElements: Element[] = [];

    this._walkElementsFast(root, (el: Element) => {
      elementCount++;
      const tag = el.tagName;

      if (tag === 'A') {
        links.push({
          href: el.getAttribute('href') ?? '',
          text: el.textContent.trim(),
        });
      } else if (tag === 'FORM') {
        formElements.push(el);
      } else if (tag === 'IMG') {
        images.push({
          src: el.getAttribute('src') ?? '',
          alt: el.getAttribute('alt') ?? '',
        });
      } else if (HEADING_TAGS.has(tag)) {
        headings.push({
          level: parseInt(tag[1], 10),
          text: el.textContent.trim(),
        });
      }
    });

    // Count fields for each form (small targeted walk per form)
    for (const formEl of formElements) {
      let fieldCount = 0;
      this._walkElementsFast(formEl, (child: Element) => {
        if (DixieSnapshot.FIELD_TAGS.has(child.tagName)) {
          fieldCount++;
        }
      });
      forms.push({
        action: formEl.getAttribute('action') ?? '',
        method: formEl.getAttribute('method') ?? '',
        fieldCount,
      });
    }

    return { elementCount, forms, links, headings, images };
  }

  /**
   * Single-pass counter for toSummary — only counts, doesn't build arrays.
   */
  private _countAll(root: Node | null): {
    elementCount: number;
    formCount: number;
    linkCount: number;
    headingCount: number;
  } {
    if (!root) {
      return { elementCount: 0, formCount: 0, linkCount: 0, headingCount: 0 };
    }

    let elementCount = 0;
    let formCount = 0;
    let linkCount = 0;
    let headingCount = 0;

    this._walkElementsFast(root, (el: Element) => {
      elementCount++;
      const tag = el.tagName;
      if (tag === 'A') linkCount++;
      else if (tag === 'FORM') formCount++;
      else if (HEADING_TAGS.has(tag)) headingCount++;
    });

    return { elementCount, formCount, linkCount, headingCount };
  }

  /**
   * Fast element walker using index-based loop instead of for-of iterator.
   */
  private _walkElementsFast(root: Node, callback: (el: Element) => void): void {
    const children = root._children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child.nodeType === Node.ELEMENT_NODE) {
        callback(child as Element);
      }
      this._walkElementsFast(child, callback);
    }
  }
}
