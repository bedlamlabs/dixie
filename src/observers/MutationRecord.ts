import { Node } from '../nodes/Node';
import { NodeList } from '../nodes/NodeList';

/**
 * MutationRecord — represents a single DOM mutation observed by MutationObserver.
 *
 * Each record captures the type of mutation, the target node, and details about
 * what changed (added/removed nodes, attribute names, old values, siblings).
 *
 * This follows the DOM Living Standard MutationRecord interface.
 */
export class MutationRecord {
  readonly type: 'childList' | 'attributes' | 'characterData';
  readonly target: Node;
  readonly addedNodes: NodeList<Node>;
  readonly removedNodes: NodeList<Node>;
  readonly previousSibling: Node | null;
  readonly nextSibling: Node | null;
  readonly attributeName: string | null;
  readonly attributeNamespace: string | null;
  readonly oldValue: string | null;

  constructor(init: {
    type: 'childList' | 'attributes' | 'characterData';
    target: Node;
    addedNodes?: Node[];
    removedNodes?: Node[];
    previousSibling?: Node | null;
    nextSibling?: Node | null;
    attributeName?: string | null;
    attributeNamespace?: string | null;
    oldValue?: string | null;
  }) {
    this.type = init.type;
    this.target = init.target;
    this.addedNodes = new NodeList<Node>(init.addedNodes ?? []);
    this.removedNodes = new NodeList<Node>(init.removedNodes ?? []);
    this.previousSibling = init.previousSibling ?? null;
    this.nextSibling = init.nextSibling ?? null;
    this.attributeName = init.attributeName ?? null;
    this.attributeNamespace = init.attributeNamespace ?? null;
    this.oldValue = init.oldValue ?? null;
  }
}
