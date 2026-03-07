import { Node } from './Node';

/**
 * Text — a DOM text node containing character data.
 *
 * Per the DOM Living Standard, Text nodes are leaf nodes (no children)
 * with nodeType 3 and nodeName '#text'. They hold character data
 * accessible via the `data` property.
 */
export class Text extends Node {
  constructor(data: string = '') {
    super(Node.TEXT_NODE, '#text');
    this._textData = data;
  }

  get data(): string {
    return this._textData ?? '';
  }

  set data(value: string) {
    this._textData = value;
  }

  get length(): number {
    return this.data.length;
  }

  get textContent(): string {
    return this.data;
  }

  set textContent(value: string) {
    this.data = value ?? '';
  }

  get nodeValue(): string {
    return this.data;
  }

  set nodeValue(value: string) {
    this.data = value ?? '';
  }

  /**
   * wholeText — returns the concatenation of this text node and all
   * logically adjacent text nodes (siblings that are also Text nodes
   * with no intervening non-Text nodes).
   */
  get wholeText(): string {
    let text = '';

    // Walk backwards to the first adjacent text node
    let current: Node | null = this as Node;
    while (current.previousSibling && current.previousSibling.nodeType === Node.TEXT_NODE) {
      current = current.previousSibling;
    }

    // Walk forward concatenating all adjacent text nodes
    while (current && current.nodeType === Node.TEXT_NODE) {
      text += (current as Text).data;
      current = current.nextSibling;
    }

    return text;
  }

  /**
   * splitText — splits this text node at the given offset, returning
   * the new text node containing the remainder.
   */
  splitText(offset: number): Text {
    if (offset < 0 || offset > this.data.length) {
      throw new DOMException(
        `Failed to execute 'splitText' on 'Text': The offset ${offset} is larger than the Text node's length.`,
        'IndexSizeError',
      );
    }

    const remainder = this.data.substring(offset);
    this.data = this.data.substring(0, offset);

    const newNode = new Text(remainder);
    newNode.ownerDocument = this.ownerDocument;

    // Insert the new node after this one in the parent
    if (this.parentNode) {
      const nextSib = this.nextSibling;
      this.parentNode.insertBefore(newNode, nextSib);
    }

    return newNode;
  }

  cloneNode(_deep?: boolean): Text {
    const clone = new Text(this.data);
    clone.ownerDocument = this.ownerDocument;
    return clone;
  }
}
