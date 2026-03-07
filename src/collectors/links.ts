export interface LinkEntry {
  tag: string;
  text: string;
  href?: string;
  type?: string;
}

export interface LinksResult {
  links: LinkEntry[];
  buttons: Array<{ text: string; type: string }>;
}

export function collectLinks(doc: any): LinksResult {
  const links: LinkEntry[] = [];
  const buttons: Array<{ text: string; type: string }> = [];

  const anchors = doc.querySelectorAll('a');
  for (const a of anchors) {
    links.push({
      tag: 'a',
      text: (a.textContent ?? '').trim(),
      href: a.getAttribute('href') ?? undefined,
    });
  }

  const btns = doc.querySelectorAll('button');
  for (const btn of btns) {
    buttons.push({
      text: (btn.textContent ?? '').trim(),
      type: btn.getAttribute('type') ?? 'button',
    });
  }

  return { links, buttons };
}
