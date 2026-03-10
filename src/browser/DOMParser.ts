import { Document } from '../nodes/Document';

export class DOMParser {
  parseFromString(markup: string, _mimeType: string): Document {
    const document = new Document();

    const htmlMatch = markup.match(/<html[^>]*>([\s\S]*?)<\/html>/i);
    const source = htmlMatch ? htmlMatch[1] : markup;

    const headMatch = source.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    if (headMatch) {
      document.head.innerHTML = headMatch[1];
    }

    const bodyMatch = source.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    document.body.innerHTML = bodyMatch ? bodyMatch[1] : source;

    return document;
  }
}
