export interface StructureNode {
  tag: string;
  children: StructureNode[];
  text?: string;
  id?: string;
  classes?: string[];
}

export interface StructureResult {
  tree: StructureNode;
  elementCount: number;
}

function walkElement(el: any, depth: number, maxDepth: number, counter: { count: number }): StructureNode {
  counter.count++;
  const node: StructureNode = {
    tag: (el.tagName ?? 'unknown').toLowerCase(),
    children: [],
  };

  const text = getDirectText(el);
  if (text) node.text = text.length > 80 ? text.slice(0, 80) : text;

  const id = el.getAttribute?.('id');
  if (id) node.id = id;

  if (depth >= maxDepth) return node;

  const children = el.children ?? [];
  for (const child of children) {
    node.children.push(walkElement(child, depth + 1, maxDepth, counter));
  }

  return node;
}

function getDirectText(el: any): string {
  let text = '';
  const children = el.childNodes ?? [];
  for (const child of children) {
    if (child.nodeType === 3) { // TEXT_NODE
      text += child.textContent ?? '';
    }
  }
  return text.trim();
}

export function collectStructure(doc: any, options?: { depth?: number }): StructureResult {
  const maxDepth = options?.depth ?? 5;
  const body = doc.body;
  if (!body) {
    return { tree: { tag: 'body', children: [] }, elementCount: 0 };
  }

  const counter = { count: 0 };
  const tree = walkElement(body, 0, maxDepth, counter);
  return { tree, elementCount: counter.count };
}
