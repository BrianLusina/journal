import { NotionToMarkdown } from 'notion-to-md';
import type { CMSAdapter } from '../adapter';
import type { CMSPage, CMSPageRequest, UnifiedPost } from '../types';
import { getDataSourceId, notion } from './client';
import { mapNotionPage, type NotionPage } from './map';
import { listedFilters, NOTION_PROPERTY, publishedFilters } from './properties';

const markdown = new NotionToMarkdown({ notionClient: notion });

const mapPages = (pages: unknown[]): UnifiedPost[] => (pages as NotionPage[]).map(mapNotionPage);

/**
 * Whether `tag` is one of the Tags options. Tag pages are shared by every source, so most tags
 * are not Notion's; checking first avoids filtering on a value that isn't an option.
 */
async function isTagOption(dataSourceId: string, tag: string): Promise<boolean> {
  const dataSource = await notion.dataSources.retrieve({ data_source_id: dataSourceId });
  const tags = dataSource.properties[NOTION_PROPERTY.tags];
  return tags?.type === 'multi_select' && tags.multi_select.options.some(option => option.name === tag);
}

/**
 * Posts read straight from the 📔 Journal CMS data source, server-side. Callers check
 * isNotionConfigured() first. The cursor is Notion's own.
 */
export const notionSource: CMSAdapter = {
  source: 'notion',

  async getPosts({ cursor, limit, category, tag }: CMSPageRequest): Promise<CMSPage> {
    const dataSourceId = await getDataSourceId();
    if (tag && !(await isTagOption(dataSourceId, tag))) {
      return { items: [], nextCursor: null };
    }

    const categoryFilters = category
      ? [{ property: NOTION_PROPERTY.categories, multi_select: { contains: category } }]
      : [];
    const tagFilters = tag ? [{ property: NOTION_PROPERTY.tags, multi_select: { contains: tag } }] : [];

    // One page per call: the caller follows nextCursor, so no call reads from the start.
    const result = await notion.dataSources.query({
      data_source_id: dataSourceId,
      page_size: limit,
      start_cursor: cursor,
      sorts: [{ property: NOTION_PROPERTY.published, direction: 'descending' }],
      // The SDK models each property filter as a discriminated union; building the whole filter
      // here keeps that type information.
      filter: { and: [...listedFilters, ...categoryFilters, ...tagFilters] },
    });

    return { items: mapPages(result.results), nextCursor: result.has_more ? result.next_cursor : null };
  },

  async getPostBySlug(slug: string): Promise<UnifiedPost | null> {
    const result = await notion.dataSources.query({
      data_source_id: await getDataSourceId(),
      page_size: 1,
      filter: {
        and: [{ property: NOTION_PROPERTY.slug, rich_text: { equals: slug } }, ...publishedFilters],
      },
    });

    const [page] = result.results;
    if (!page) return null;

    const blocks = await markdown.pageToMarkdown(page.id);
    return { ...mapNotionPage(page as NotionPage), body: markdown.toMarkdownString(blocks).parent };
  },

  async getSearchIndex(): Promise<UnifiedPost[]> {
    const dataSourceId = await getDataSourceId();
    const pages: unknown[] = [];
    let cursor: string | undefined;
    do {
      const page = await notion.dataSources.query({
        data_source_id: dataSourceId,
        page_size: 100,
        start_cursor: cursor,
        sorts: [{ property: NOTION_PROPERTY.published, direction: 'descending' }],
        filter: { and: listedFilters },
      });
      pages.push(...page.results);
      // An index missing posts must not be returned as if it were whole.
      if (page.has_more && !page.next_cursor) {
        throw new Error('Notion reported more posts without a cursor');
      }
      cursor = page.has_more ? page.next_cursor ?? undefined : undefined;
    } while (cursor);
    return mapPages(pages);
  },
};
