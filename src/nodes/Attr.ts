/**
 * Attr — represents a single attribute on an Element.
 *
 * Per the DOM Living Standard, Attr is a Node subclass (nodeType 2),
 * but we keep it lightweight since most Attr usage is through
 * Element's attribute methods rather than direct Attr manipulation.
 */
export class Attr {
  readonly name: string;
  value: string;
  ownerElement: any | null = null; // typed loosely until Element import would cause circular ref

  constructor(name: string, value: string = '') {
    this.name = name;
    this.value = value;
  }
}
