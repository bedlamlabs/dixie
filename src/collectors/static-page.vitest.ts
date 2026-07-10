import { describe, it, expect } from 'vitest';
import { parseHTML } from '../index';
import { collectStaticPage, collectRepeatedGroups } from './static-page';

describe('collectStaticPage', () => {
  describe('links', () => {
    it('collects all a[href] with whitespace-collapsed text', () => {
      const doc = parseHTML('<a href="/x">  Hello \n  World </a><a href="/y">Y</a><a>no href</a>');
      const { links } = collectStaticPage(doc);
      expect(links).toEqual([
        { href: '/x', text: 'Hello World' },
        { href: '/y', text: 'Y' },
      ]);
    });

    it('includes rel only when non-empty', () => {
      const doc = parseHTML('<a href="/a" rel=" nofollow ">A</a><a href="/b" rel="  ">B</a>');
      const { links } = collectStaticPage(doc);
      expect(links[0]).toEqual({ href: '/a', text: 'A', rel: 'nofollow' });
      expect(links[1]).toEqual({ href: '/b', text: 'B' });
      expect('rel' in links[1]).toBe(false);
    });

    it('includes anchors inside svg subtrees (element collection is not text-filtered)', () => {
      const doc = parseHTML('<svg><a href="/svg-link">S</a></svg><a href="/plain">P</a>');
      const { links } = collectStaticPage(doc);
      expect(links.map((l) => l.href)).toEqual(['/svg-link', '/plain']);
    });

    it('treats an empty href attribute as present', () => {
      const doc = parseHTML('<a href="">E</a>');
      const { links } = collectStaticPage(doc);
      expect(links).toEqual([{ href: '', text: 'E' }]);
    });
  });

  describe('buttons', () => {
    it('collects button, role=button, role=link, data-url, data-href elements', () => {
      const doc = parseHTML(
        '<button data-url="/b"> Go </button>' +
        '<div role="button" aria-label="Lbl"></div>' +
        '<span data-href="/s" title="T"></span>' +
        '<div role="link">L</div>'
      );
      const { buttons } = collectStaticPage(doc);
      expect(buttons).toEqual([
        { href: '/b', text: 'Go' },
        { href: '', text: 'Lbl' },
        { href: '/s', text: 'T' },
        { href: '', text: 'L' },
      ]);
    });

    it('prefers href, then data-url, then data-href', () => {
      const doc = parseHTML('<button href="/h" data-url="/u" data-href="/dh">X</button><button data-url="/u2" data-href="/dh2">Y</button>');
      const { buttons } = collectStaticPage(doc);
      expect(buttons[0].href).toBe('/h');
      expect(buttons[1].href).toBe('/u2');
    });

    it('emits an element matching multiple button criteria only once', () => {
      const doc = parseHTML('<button role="button" data-url="/once">Once</button>');
      const { buttons } = collectStaticPage(doc);
      expect(buttons).toEqual([{ href: '/once', text: 'Once' }]);
    });

    it('prefers text, then aria-label, then title', () => {
      const doc = parseHTML('<button aria-label="A" title="T">  Txt </button><button aria-label="A2" title="T2"></button><button title="T3"></button>');
      const { buttons } = collectStaticPage(doc);
      expect(buttons.map((b) => b.text)).toEqual(['Txt', 'A2', 'T3']);
    });
  });

  describe('headings', () => {
    it('collects h1-h4 with numeric levels', () => {
      const doc = parseHTML('<h1>One</h1><h2>Two</h2><h3>Three</h3><h4>Four</h4><h5>Five</h5>');
      const { headings } = collectStaticPage(doc);
      expect(headings).toEqual([
        { text: 'One', level: 1 },
        { text: 'Two', level: 2 },
        { text: 'Three', level: 3 },
        { text: 'Four', level: 4 },
      ]);
    });

    it('excludes headings inside contextFilter ancestors', () => {
      const doc = parseHTML('<h1>Top</h1><nav><h2>NavHead</h2></nav><footer><div><h3>FootHead</h3></div></footer><h3>Three</h3>');
      const { headings } = collectStaticPage(doc, { contextFilter: 'nav, footer' });
      expect(headings).toEqual([
        { text: 'Top', level: 1 },
        { text: 'Three', level: 3 },
      ]);
    });

    it('keeps all headings when no contextFilter is given', () => {
      const doc = parseHTML('<nav><h2>NavHead</h2></nav><h1>Top</h1>');
      const { headings } = collectStaticPage(doc);
      expect(headings.map((h) => h.text)).toEqual(['NavHead', 'Top']);
    });
  });

  describe('scripts', () => {
    it('collects non-empty whitespace-collapsed script contents in document order', () => {
      const doc = parseHTML(
        '<script>var a = 1;\n  var b = 2;</script>' +
        '<script>   </script>' +
        '<script type="application/ld+json">{ "@type":\n"JobPosting" }</script>'
      );
      const { scripts } = collectStaticPage(doc);
      expect(scripts).toEqual([
        'var a = 1; var b = 2;',
        '{ "@type": "JobPosting" }',
      ]);
    });

    it('caps scripts at 80', () => {
      const html = Array.from({ length: 90 }, (_, i) => `<script>s${i}</script>`).join('');
      const doc = parseHTML(html);
      const { scripts } = collectStaticPage(doc);
      expect(scripts.length).toBe(80);
      expect(scripts[0]).toBe('s0');
      expect(scripts[79]).toBe('s79');
    });
  });

  describe('textLength', () => {
    it('measures whitespace-collapsed text excluding script/style/noscript/svg', () => {
      const doc = parseHTML(
        '<div>Hello <script>var xxxxxxxx = 1;</script><style>.a{color:red}</style><noscript>NOPE</noscript><svg><text>SVGTEXT</text></svg> World</div>'
      );
      const { textLength } = collectStaticPage(doc);
      expect(textLength).toBe('Hello World'.length);
    });

    it('collapses whitespace across node boundaries', () => {
      const doc = parseHTML('<div>a </div>\n<div> b</div>');
      const { textLength } = collectStaticPage(doc);
      // cheerio-equivalent: text nodes concatenated then collapsed → "a b"
      expect(textLength).toBe(3);
    });

    it('does not mutate the caller document', () => {
      const doc = parseHTML('<div>x<script>var y;</script><style>.s{}</style></div>');
      collectStaticPage(doc);
      expect(doc.querySelectorAll('script').length).toBe(1);
      expect(doc.querySelectorAll('style').length).toBe(1);
    });
  });

  it('returns empty collections for an empty document', () => {
    const doc = parseHTML('');
    const result = collectStaticPage(doc);
    expect(result).toEqual({ links: [], buttons: [], headings: [], scripts: [], textLength: 0 });
  });
});

describe('collectRepeatedGroups', () => {
  it('groups matching elements by parent and returns only groups of >= 2', () => {
    const doc = parseHTML(
      '<ul><li class="job-card">A</li><li class="job-card">B</li></ul>' +
      '<div><span class="job-card">lonely</span></div>'
    );
    const groups = collectRepeatedGroups(doc, { selectors: ['.job-card'] });
    expect(groups.length).toBe(1);
    expect(groups[0].length).toBe(2);
    expect(groups[0].map((el: any) => el.textContent)).toEqual(['A', 'B']);
    expect(groups[0][0].tagName).toBe('LI');
  });

  it('excludes elements inside excludeContext ancestors', () => {
    const doc = parseHTML(
      '<nav><div class="job-card">N1</div><div class="job-card">N2</div></nav>' +
      '<main><div class="job-card">M1</div><div class="job-card">M2</div></main>'
    );
    const groups = collectRepeatedGroups(doc, { selectors: ['.job-card'], excludeContext: 'nav, footer' });
    expect(groups.length).toBe(1);
    expect(groups[0].map((el: any) => el.textContent)).toEqual(['M1', 'M2']);
  });

  it('caps candidates per selector before grouping', () => {
    const doc = parseHTML('<ul>' + Array.from({ length: 5 }, (_, i) => `<li class="job-card">J${i}</li>`).join('') + '</ul>');
    const groups = collectRepeatedGroups(doc, { selectors: ['.job-card'], cap: 3 });
    expect(groups.length).toBe(1);
    expect(groups[0].length).toBe(3);
  });

  it('applies the optional filter predicate before the cap', () => {
    const doc = parseHTML(
      '<table class="jobs"><tr><th>Head</th></tr><tr><td>A</td></tr><tr><td>B</td></tr></table>'
    );
    const groups = collectRepeatedGroups(doc, {
      selectors: ['table.jobs tr'],
      filter: (el: any) => !(el.tagName === 'TR' && el.querySelector('th')),
    });
    expect(groups.length).toBe(1);
    expect(groups[0].map((el: any) => el.textContent)).toEqual(['A', 'B']);
  });

  it('collects independent groups per selector in selector order', () => {
    const doc = parseHTML(
      '<div id="a"><div class="opening">O1</div><div class="opening">O2</div></div>' +
      '<div id="b"><div class="job-card">C1</div><div class="job-card">C2</div></div>'
    );
    const groups = collectRepeatedGroups(doc, { selectors: ['.job-card', '.opening'] });
    expect(groups.length).toBe(2);
    expect(groups[0].map((el: any) => el.textContent)).toEqual(['C1', 'C2']);
    expect(groups[1].map((el: any) => el.textContent)).toEqual(['O1', 'O2']);
  });

  it('returns an empty array when nothing matches', () => {
    const doc = parseHTML('<div>nothing</div>');
    expect(collectRepeatedGroups(doc, { selectors: ['.job-card'] })).toEqual([]);
  });
});
