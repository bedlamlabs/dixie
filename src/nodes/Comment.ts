import { Node } from './Node';

/**
 * Comment — a DOM comment node (<!-- ... -->).
 *
 * Per the DOM Living Standard, Comment nodes have nodeType 8,
 * nodeName '#comment', and hold their content in the `data` property.
 */
export class Comment extends Node {
  constructor(data: string = '') {
    super(Node.COMMENT_NODE, '#comment');
    this._textData = data;
  }

  get data(): string {
    return this._textData ?? '';
  }

  set data(value: string) {
    const oldValue = this._textData ?? '';
    this._textData = value;
    this._notifyCharacterDataMutation(oldValue);
  }

  get length(): number {
    return this.data.length;
  }

  get nodeValue(): string {
    return this.data;
  }

  set nodeValue(value: string) {
    this.data = value ?? '';
  }

  cloneNode(_deep?: boolean): Comment {
    const clone = new Comment(this.data);
    clone.ownerDocument = this.ownerDocument;
    return clone;
  }
}
