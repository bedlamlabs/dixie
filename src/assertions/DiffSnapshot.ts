/**
 * DiffSnapshot — compare two DOM states and report what changed.
 *
 * Essential for detecting render regressions: capture before/after
 * snapshots and get a structured diff with CSS-like paths, change
 * types, and a human/agent-readable summary.
 */

import type { Document } from '../nodes/Document';
import { Node } from '../nodes/Node';
import type { Element } from '../nodes/Element';

// ── Public interfaces ──────────────────────────────────────────────────

export interface DiffEntry {
  type: 'added' | 'removed' | 'changed' | 'moved';
  path: string;
  element: string;
  details?: string;
}

export interface DiffResult {
  identical: boolean;
  entries: DiffEntry[];
  summary: string;
  stats: {
    added: number;
    removed: number;
    changed: number;
    moved: number;
    total: number;
  };
}

export interface SnapshotNode {
  tag: string;
  id?: string;
  classes?: string[];
  attributes?: Record<string, string>;
  text?: string;
  children?: SnapshotNode[];
  path: string;
}

export interface SnapshotData {
  timestamp: number;
  tree: SnapshotNode[];
}

// ── Attributes to skip (internal / uninteresting for diffing) ──────────

const SKIP_ATTRIBUTES = new Set(['style']);

// ── Meaningful attributes to capture ───────────────────────────────────

const MEANINGFUL_ATTRIBUTES = [
  'id', 'class', 'type', 'name', 'href', 'src', 'action', 'method',
  'value', 'for', 'role', 'aria-label', 'data-testid', 'placeholder',
  'alt', 'title', 'disabled', 'checked', 'selected', 'readonly',
  'required', 'target', 'rel',
];

// ── Implementation ─────────────────────────────────────────────────────

export class DiffSnapshot {
  /**
   * Take a snapshot of current DOM state.
   */
  static capture(doc: Document): SnapshotData {
    const tree: SnapshotNode[] = [];
    const root = doc.documentElement;
    if (root) {
      tree.push(DiffSnapshot._captureNode(root, root.tagName.toLowerCase()));
    }
    return {
      timestamp: Date.now(),
      tree,
    };
  }

  /**
   * Compare two snapshots.
   */
  static diff(before: SnapshotData, after: SnapshotData): DiffResult {
    const entries: DiffEntry[] = [];
    DiffSnapshot._diffTrees(before.tree, after.tree, entries);
    return DiffSnapshot._buildResult(entries);
  }

  /**
   * Compare current DOM against a previous snapshot.
   */
  static diffFrom(doc: Document, previousSnapshot: SnapshotData): DiffResult {
    const current = DiffSnapshot.capture(doc);
    return DiffSnapshot.diff(previousSnapshot, current);
  }

  /**
   * Convenience: capture before, run function, capture after, return diff.
   */
  static track<T>(doc: Document, fn: () => T): { result: T; diff: DiffResult } {
    const before = DiffSnapshot.capture(doc);
    const result = fn();
    const after = DiffSnapshot.capture(doc);
    return { result, diff: DiffSnapshot.diff(before, after) };
  }

  /**
   * Async version of track.
   */
  static async trackAsync<T>(doc: Document, fn: () => Promise<T>): Promise<{ result: T; diff: DiffResult }> {
    const before = DiffSnapshot.capture(doc);
    const result = await fn();
    const after = DiffSnapshot.capture(doc);
    return { result, diff: DiffSnapshot.diff(before, after) };
  }

  // ── Private: capture helpers ───────────────────────────────────────

  private static _captureNode(node: Node, parentPath: string): SnapshotNode {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      // Text node — return a minimal snapshot node
      return {
        tag: '#text',
        text: node.textContent.trim(),
        path: parentPath,
      };
    }

    const el = node as Element;
    const tag = el.tagName.toLowerCase();

    // Build this node's path segment
    const path = parentPath;

    // Capture attributes
    const attributes: Record<string, string> = {};
    let hasAttributes = false;
    for (const attrName of MEANINGFUL_ATTRIBUTES) {
      if (attrName === 'id' || attrName === 'class') continue; // handled separately
      const val = el.getAttribute(attrName);
      if (val !== null) {
        attributes[attrName] = val;
        hasAttributes = true;
      }
    }

    // Capture classes
    const className = el.getAttribute('class');
    const classes = className ? className.split(/\s+/).filter(c => c.length > 0) : undefined;

    // Capture id
    const id = el.getAttribute('id') || undefined;

    // Capture text content (only direct text, not from children)
    let directText: string | undefined;
    const elementChildren: SnapshotNode[] = [];
    let childElementIndex = 0;

    for (let i = 0; i < el._children.length; i++) {
      const child = el._children[i];
      if (child.nodeType === Node.TEXT_NODE) {
        const trimmed = (child._textData ?? '').trim();
        if (trimmed) {
          directText = directText ? directText + ' ' + trimmed : trimmed;
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const childEl = child as Element;
        const childTag = childEl.tagName.toLowerCase();
        const childPath = DiffSnapshot._buildChildPath(path, childEl, childElementIndex);
        childElementIndex++;
        elementChildren.push(DiffSnapshot._captureNode(child, childPath));
      }
    }

    const result: SnapshotNode = {
      tag,
      path,
    };

    if (id) result.id = id;
    if (classes && classes.length > 0) result.classes = classes;
    if (hasAttributes) result.attributes = attributes;
    if (directText) result.text = directText;
    if (elementChildren.length > 0) result.children = elementChildren;

    return result;
  }

  private static _buildChildPath(parentPath: string, el: Element, indexAmongSiblings: number): string {
    const tag = el.tagName.toLowerCase();
    const id = el.getAttribute('id');
    const className = el.getAttribute('class');

    let segment = tag;
    if (id) {
      segment = `${tag}#${id}`;
    } else if (className) {
      const firstClass = className.split(/\s+/)[0];
      if (firstClass) {
        segment = `${tag}.${firstClass}`;
      }
    }

    // Count same-tag siblings at same level to determine nth-child if needed
    // For simplicity, always use nth-child when no id
    if (!id) {
      segment += `:nth-child(${indexAmongSiblings + 1})`;
    }

    return `${parentPath} > ${segment}`;
  }

  // ── Private: diff algorithm ────────────────────────────────────────

  private static _diffTrees(beforeNodes: SnapshotNode[], afterNodes: SnapshotNode[], entries: DiffEntry[]): void {
    const maxLen = Math.max(beforeNodes.length, afterNodes.length);

    for (let i = 0; i < maxLen; i++) {
      const beforeNode = i < beforeNodes.length ? beforeNodes[i] : null;
      const afterNode = i < afterNodes.length ? afterNodes[i] : null;

      if (beforeNode && !afterNode) {
        // Node was removed
        DiffSnapshot._collectRemoved(beforeNode, entries);
      } else if (!beforeNode && afterNode) {
        // Node was added
        DiffSnapshot._collectAdded(afterNode, entries);
      } else if (beforeNode && afterNode) {
        // Both exist — compare
        DiffSnapshot._diffNodes(beforeNode, afterNode, entries);
      }
    }
  }

  private static _diffNodes(before: SnapshotNode, after: SnapshotNode, entries: DiffEntry[]): void {
    // Different tags = removed old + added new
    if (before.tag !== after.tag) {
      DiffSnapshot._collectRemoved(before, entries);
      DiffSnapshot._collectAdded(after, entries);
      return;
    }

    // Same tag — check for changes
    const changes: string[] = [];

    // Text content change
    if ((before.text || '') !== (after.text || '')) {
      changes.push(`text: "${before.text || ''}" -> "${after.text || ''}"`);
    }

    // Class changes
    const beforeClasses = (before.classes || []).join(' ');
    const afterClasses = (after.classes || []).join(' ');
    if (beforeClasses !== afterClasses) {
      changes.push(`classes: "${beforeClasses}" -> "${afterClasses}"`);
    }

    // ID change
    if ((before.id || '') !== (after.id || '')) {
      changes.push(`id: "${before.id || ''}" -> "${after.id || ''}"`);
    }

    // Attribute changes
    const beforeAttrs = before.attributes || {};
    const afterAttrs = after.attributes || {};
    const allAttrKeys = new Set([...Object.keys(beforeAttrs), ...Object.keys(afterAttrs)]);
    for (const key of allAttrKeys) {
      const bVal = beforeAttrs[key];
      const aVal = afterAttrs[key];
      if (bVal !== aVal) {
        if (bVal === undefined) {
          changes.push(`+${key}="${aVal}"`);
        } else if (aVal === undefined) {
          changes.push(`-${key}="${bVal}"`);
        } else {
          changes.push(`${key}: "${bVal}" -> "${aVal}"`);
        }
      }
    }

    if (changes.length > 0) {
      entries.push({
        type: 'changed',
        path: after.path,
        element: DiffSnapshot._describeNode(after),
        details: changes.join('; '),
      });
    }

    // Recurse into children
    const beforeChildren = before.children || [];
    const afterChildren = after.children || [];
    DiffSnapshot._diffTrees(beforeChildren, afterChildren, entries);
  }

  private static _collectAdded(node: SnapshotNode, entries: DiffEntry[]): void {
    if (node.tag === '#text') return; // Skip standalone text nodes in diff entries
    entries.push({
      type: 'added',
      path: node.path,
      element: DiffSnapshot._describeNode(node),
    });
    if (node.children) {
      for (const child of node.children) {
        DiffSnapshot._collectAdded(child, entries);
      }
    }
  }

  private static _collectRemoved(node: SnapshotNode, entries: DiffEntry[]): void {
    if (node.tag === '#text') return; // Skip standalone text nodes in diff entries
    entries.push({
      type: 'removed',
      path: node.path,
      element: DiffSnapshot._describeNode(node),
    });
    if (node.children) {
      for (const child of node.children) {
        DiffSnapshot._collectRemoved(child, entries);
      }
    }
  }

  private static _describeNode(node: SnapshotNode): string {
    let desc = node.tag;
    if (node.id) desc += `#${node.id}`;
    if (node.classes && node.classes.length > 0) {
      desc += '.' + node.classes.join('.');
    }
    return desc;
  }

  // ── Private: result builder ────────────────────────────────────────

  private static _buildResult(entries: DiffEntry[]): DiffResult {
    const stats = { added: 0, removed: 0, changed: 0, moved: 0, total: 0 };
    for (const entry of entries) {
      stats[entry.type]++;
      stats.total++;
    }

    const identical = entries.length === 0;

    // Build summary
    const parts: string[] = [];
    if (stats.added > 0) parts.push(`${stats.added} element${stats.added !== 1 ? 's' : ''} added`);
    if (stats.removed > 0) parts.push(`${stats.removed} element${stats.removed !== 1 ? 's' : ''} removed`);
    if (stats.changed > 0) parts.push(`${stats.changed} element${stats.changed !== 1 ? 's' : ''} changed`);
    if (stats.moved > 0) parts.push(`${stats.moved} element${stats.moved !== 1 ? 's' : ''} moved`);

    const summary = identical ? 'No changes detected' : parts.join(', ');

    return { identical, entries, summary, stats };
  }
}
