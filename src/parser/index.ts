/**
 * Parser module — public API for HTML parsing and serialization.
 */

export { parseHTML } from './HTMLParser';
export { serializeHTML } from './HTMLSerializer';
export { tokenize, decodeEntities } from './HTMLTokenizer';
export { isVoidElement } from './HTMLParser';
export type { Token, StartTagToken, EndTagToken, TextToken, CommentToken, Attribute } from './HTMLTokenizer';
