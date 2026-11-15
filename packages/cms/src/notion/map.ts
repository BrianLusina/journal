import type { UnifiedAsset, UnifiedAuthor, UnifiedPost } from '../types';
import { NOTION_PROPERTY } from './properties';

type NotionText = { type?: string; plain_text?: string; mention?: { type: string } }[];

type NotionFile =
  | { type: 'external'; external: { url: string } }
  | { type: 'file'; file: { url: string } };

/**
 * The subset of a Notion page object (as dataSources.query returns it) that the mapping reads.
 * Keys are the 📔 Journal CMS properties named in properties.ts.
 */
export type NotionPage = {
  id: string;
  created_time: string;
  properties: {
    [NOTION_PROPERTY.title]?: { title?: NotionText };
    [NOTION_PROPERTY.slug]?: { rich_text?: NotionText };
    [NOTION_PROPERTY.description]?: { rich_text?: NotionText };
    [NOTION_PROPERTY.categories]?: { multi_select?: { name: string }[] };
    [NOTION_PROPERTY.published]?: { date?: { start: string } | null };
    [NOTION_PROPERTY.tags]?: { multi_select?: { name: string }[] };
    [NOTION_PROPERTY.authors]?: { rich_text?: NotionText };
    [NOTION_PROPERTY.coverImage]?: { files?: NotionFile[] };
  };
};

/**
 * Notion splits text wherever its formatting changes, so join every segment. A mention of a
 * workspace member reads as "@Name"; drop the "@".
 */
function plainText(text: NotionText = []): string {
  return text
    .map(segment =>
      segment.type === 'mention' && segment.mention?.type === 'user'
        ? segment.plain_text?.replace(/^@/, '')
        : segment.plain_text,
    )
    .join('');
}

/**
 * Maps a Notion Page object to the UnifiedPost domain model.
 */
export function mapNotionPage(page: NotionPage): UnifiedPost {
  const properties = page.properties;

  const title = plainText(properties[NOTION_PROPERTY.title]?.title) || 'Untitled';
  // The posts routes only return pages with a slug, and the slug route matches the whole slug
  // text, so join every segment rather than taking the first.
  const slug = plainText(properties[NOTION_PROPERTY.slug]?.rich_text);
  const description = plainText(properties[NOTION_PROPERTY.description]?.rich_text) || undefined;
  // Categories is a multi-select; a UnifiedPost has one category, as a Contentful post does.
  const category = properties[NOTION_PROPERTY.categories]?.multi_select?.[0]?.name;
  const publishDate = properties[NOTION_PROPERTY.published]?.date?.start || page.created_time;
  const tags = properties[NOTION_PROPERTY.tags]?.multi_select?.map(tag => tag.name) || [];

  // authors is a text property: one author, whose name may be typed or a mention.
  const authorName = plainText(properties[NOTION_PROPERTY.authors]?.rich_text);
  const authors: UnifiedAuthor[] = authorName
    ? [{ id: 'notion-author', source: 'notion', name: authorName }]
    : [];

  let heroImage: UnifiedAsset | undefined;
  const cover = properties[NOTION_PROPERTY.coverImage]?.files?.[0];
  if (cover) {
    const url = cover.type === 'external' ? cover.external.url : cover.file.url;
    heroImage = { url, title: 'Cover Image' };
  }

  return {
    id: page.id,
    source: 'notion',
    title,
    slug,
    description,
    category,
    publishDate,
    heroImage,
    thumbnail: heroImage, // fallback thumbnail to heroImage
    tags,
    authors,
  };
}
