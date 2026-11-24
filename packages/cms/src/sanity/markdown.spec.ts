import { toMarkdown } from './markdown';
import type { SanityBodyNode } from './projection';

let key = 0;
const span = (text: string, marks: string[] = []) => ({ _type: 'span', _key: `s${key++}`, text, marks });
const block = (children: ReturnType<typeof span>[], extra: Record<string, unknown> = {}): SanityBodyNode => ({
  _type: 'block',
  _key: `b${key++}`,
  style: 'normal',
  markDefs: [],
  children,
  ...extra,
});

describe('toMarkdown', () => {
  it('writes paragraphs separated by a blank line', () => {
    expect(toMarkdown([block([span('One')]), block([span('Two')])])).toBe('One\n\nTwo');
  });

  it.each([
    ['h1', '# Title'],
    ['h2', '## Title'],
    ['h3', '### Title'],
    ['h4', '#### Title'],
    ['blockquote', '> Title'],
  ])('writes the %s style', (style, expected) => {
    expect(toMarkdown([block([span('Title')], { style })])).toBe(expected);
  });

  it('writes decorators, nested ones included', () => {
    expect(toMarkdown([block([span('bold', ['strong']), span(' '), span('both', ['strong', 'em']), span(' '), span('x()', ['code'])])])).toBe(
      '**bold** ***both*** `x()`',
    );
    expect(toMarkdown([block([span('gone', ['strike-through'])])])).toBe('~~gone~~');
  });

  it('writes links from their markDef, and keeps the text of a link it cannot resolve', () => {
    const linked = block([span('the docs', ['l1']), span(' and '), span('more', ['missing'])], {
      markDefs: [{ _type: 'link', _key: 'l1', href: 'https://www.sanity.io' }],
    });

    expect(toMarkdown([linked])).toBe('[the docs](https://www.sanity.io) and more');
  });

  it('groups consecutive list items into one list, nested by level', () => {
    const item = (text: string, listItem: string, level = 1) => block([span(text)], { listItem, level });

    expect(
      toMarkdown([
        item('a', 'bullet'),
        item('a.1', 'bullet', 2),
        item('b', 'bullet'),
        block([span('After')]),
        item('first', 'number'),
        item('second', 'number'),
      ]),
    ).toBe('- a\n  - a.1\n- b\n\nAfter\n\n1. first\n1. second');
  });

  it('fences code with its language, longer than any backtick run inside it', () => {
    expect(toMarkdown([{ _type: 'code', _key: 'c1', code: 'const a = 1', language: 'ts' }])).toBe('```ts\nconst a = 1\n```');
    expect(toMarkdown([{ _type: 'code', _key: 'c2', code: 'a\n```\nb' }])).toBe('````\na\n```\nb\n````');
  });

  it('writes images from their resolved URL, and leaves out one without', () => {
    expect(toMarkdown([{ _type: 'image', _key: 'i1', alt: 'Diagram', url: 'https://cdn.sanity.io/x.png' }])).toBe(
      '![Diagram](https://cdn.sanity.io/x.png)',
    );
    expect(toMarkdown([{ _type: 'image', _key: 'i2', alt: 'Broken' }])).toBe('');
  });

  it('leaves out block types it does not know, instead of writing their raw data', () => {
    expect(toMarkdown([block([span('Kept')]), { _type: 'chart', _key: 'x1', title: 'Q3' }])).toBe('Kept');
  });
});
