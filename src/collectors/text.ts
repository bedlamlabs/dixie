export interface TextResult {
  text: string;
}

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT']);

export function collectText(doc: any): TextResult {
  const texts: string[] = [];
  const body = doc.body;
  if (!body) return { text: '' };

  collectTextFromNode(body, texts);
  return { text: texts.join('\n') };
}

function collectTextFromNode(node: any, texts: string[]): void {
  if (node.nodeType === 3) { // TEXT_NODE
    const text = (node.textContent ?? '').trim();
    if (text.length > 0) {
      texts.push(text);
    }
    return;
  }

  if (node.nodeType === 1) { // ELEMENT_NODE
    if (SKIP_TAGS.has(node.tagName)) return;
    const children = node.childNodes ?? [];
    for (const child of children) {
      collectTextFromNode(child, texts);
    }
  }
}
