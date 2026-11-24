import type { SanityBodyNode } from './projection';

// Portable Text → Markdown, for exactly what the Studio schema's body allows: text blocks (styles,
// lists, decorators, links), images and code (@sanity/code-input). Hand-written rather than
// @portabletext/markdown, which is ES-only: the blog's CommonJS functions couldn't load it on every
// runtime (dependencies.spec.ts).

type Span = { _type: string; text?: string; marks?: string[] };
type MarkDef = { _key: string; _type: string; href?: string };
type TextBlock = SanityBodyNode & {
  style?: string;
  listItem?: string;
  level?: number;
  children?: Span[];
  markDefs?: MarkDef[];
};

const DECORATORS: Record<string, string> = { strong: '**', em: '*', code: '`', 'strike-through': '~~' };
const HEADINGS: Record<string, string> = { h1: '#', h2: '##', h3: '###', h4: '####', h5: '#####', h6: '######' };

function spanText(span: Span, markDefs: MarkDef[]): string {
  let text = span.text ?? '';
  for (const mark of span.marks ?? []) {
    const decorator = DECORATORS[mark];
    if (decorator) {
      text = `${decorator}${text}${decorator}`;
      continue;
    }
    const link = markDefs.find(def => def._key === mark && def._type === 'link');
    if (link?.href) text = `[${text}](${link.href})`;
  }
  return text;
}

function inlineText(block: TextBlock): string {
  const markDefs = block.markDefs ?? [];
  return (block.children ?? []).map(child => (child._type === 'span' ? spanText(child, markDefs) : '')).join('');
}

function textBlock(block: TextBlock): string {
  const text = inlineText(block);
  const heading = HEADINGS[block.style ?? ''];
  if (heading) return `${heading} ${text}`;
  if (block.style === 'blockquote') return `> ${text}`;
  return text;
}

function listItem(block: TextBlock): string {
  const indent = '  '.repeat(Math.max(0, (block.level ?? 1) - 1));
  return `${indent}${block.listItem === 'number' ? '1.' : '-'} ${inlineText(block)}`;
}

function codeBlock(node: SanityBodyNode): string {
  const code = typeof node.code === 'string' ? node.code : '';
  const longestRun = Math.max(0, ...(code.match(/`+/g) ?? []).map(run => run.length));
  const fence = '`'.repeat(Math.max(3, longestRun + 1));
  return `${fence}${typeof node.language === 'string' ? node.language : ''}\n${code}\n${fence}`;
}

function imageBlock(node: SanityBodyNode): string {
  return typeof node.url === 'string' && node.url ? `![${typeof node.alt === 'string' ? node.alt : ''}](${node.url})` : '';
}

/** A Sanity body as Markdown. Block types the schema doesn't allow are left out. */
export function toMarkdown(body: SanityBodyNode[]): string {
  const parts: string[] = [];
  let list: string[] = [];
  const endList = () => {
    if (list.length) parts.push(list.join('\n'));
    list = [];
  };

  for (const node of body) {
    if (node._type === 'block' && (node as TextBlock).listItem) {
      list.push(listItem(node as TextBlock));
      continue;
    }
    endList();
    if (node._type === 'block') parts.push(textBlock(node as TextBlock));
    else if (node._type === 'code') parts.push(codeBlock(node));
    else if (node._type === 'image') parts.push(imageBlock(node));
  }
  endList();

  return parts.filter(Boolean).join('\n\n');
}
