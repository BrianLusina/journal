import type { Mock } from 'vitest';
import { getDataSourceId, notion } from './client';
import { notionPage } from './__fixtures__';
import { notionSource } from './source';

vi.mock('./client', () => ({
  getDataSourceId: vi.fn(),
  notion: { dataSources: { query: vi.fn(), retrieve: vi.fn() } },
}));
vi.mock('notion-to-md', () => ({
  NotionToMarkdown: vi.fn().mockImplementation(() => ({
    pageToMarkdown: vi.fn().mockResolvedValue([]),
    toMarkdownString: () => ({ parent: '# Body' }),
  })),
}));

const queryResult = (results: unknown[], next: string | null = null) =>
  (notion.dataSources.query as Mock).mockResolvedValue({ results, has_more: next !== null, next_cursor: next });

const tagsSchema = (...names: string[]) => ({
  properties: { Tags: { type: 'multi_select', multi_select: { options: names.map(name => ({ name })) } } },
});

describe('notionSource', () => {
  beforeEach(() => {
    (getDataSourceId as Mock).mockResolvedValue('ds-1');
  });

  describe('getPosts', () => {
    it('reads one page of listed posts from the resolved data source, newest first, mapped', async () => {
      queryResult([notionPage()]);

      const page = await notionSource.getPosts({ limit: 10 });

      // Published means Status is Published and the post is dated; a listed post also has a slug.
      expect(notion.dataSources.query).toHaveBeenCalledWith({
        data_source_id: 'ds-1',
        page_size: 10,
        start_cursor: undefined,
        sorts: [{ property: 'Published', direction: 'descending' }],
        filter: {
          and: [
            { property: 'Status', status: { equals: 'Published' } },
            { property: 'Published', date: { is_not_empty: true } },
            { property: 'Slug', rich_text: { is_not_empty: true } },
          ],
        },
      });
      expect(page.items.map(post => [post.slug, post.source])).toEqual([['navigating-decision-making', 'notion']]);
      expect(page.nextCursor).toBeNull();
    });

    it('continues from the cursor, filters by category, and passes on the next cursor while Notion has more', async () => {
      queryResult([notionPage()], 'cursor-3');

      const page = await notionSource.getPosts({ limit: 1, cursor: 'cursor-2', category: 'engineering strategy 101' });

      const request = (notion.dataSources.query as Mock).mock.calls[0][0];
      expect(request).toMatchObject({ page_size: 1, start_cursor: 'cursor-2' });
      expect(request.filter.and).toContainEqual({ property: 'Categories', multi_select: { contains: 'engineering strategy 101' } });
      expect(page.nextCursor).toBe('cursor-3');
    });

    it('reads posts carrying the tag by its exact name', async () => {
      (notion.dataSources.retrieve as Mock).mockResolvedValue(tagsSchema('Decision', 'Framework'));
      queryResult([]);

      await notionSource.getPosts({ limit: 10, tag: 'Framework' });

      const { filter } = (notion.dataSources.query as Mock).mock.calls[0][0];
      expect(filter.and).toContainEqual({ property: 'Tags', multi_select: { contains: 'Framework' } });
    });

    it('answers no posts, without querying, when the tag is not a Tags option', async () => {
      (notion.dataSources.retrieve as Mock).mockResolvedValue(tagsSchema('Framework'));

      await expect(notionSource.getPosts({ limit: 10, tag: 'framework' })).resolves.toEqual({ items: [], nextCursor: null });
      expect(notion.dataSources.retrieve).toHaveBeenCalledWith({ data_source_id: 'ds-1' });
      expect(notion.dataSources.query).not.toHaveBeenCalled();
    });
  });

  describe('getPostBySlug', () => {
    it('finds a published post by slug and returns it with its Markdown body', async () => {
      queryResult([notionPage()]);

      const post = await notionSource.getPostBySlug('navigating-decision-making');

      // The same published rule as the listing, so every post listed can be opened and no other.
      expect(notion.dataSources.query).toHaveBeenCalledWith({
        data_source_id: 'ds-1',
        page_size: 1,
        filter: {
          and: [
            { property: 'Slug', rich_text: { equals: 'navigating-decision-making' } },
            { property: 'Status', status: { equals: 'Published' } },
            { property: 'Published', date: { is_not_empty: true } },
          ],
        },
      });
      expect(post).toMatchObject({ id: '7d3761f9-323d-4a15-a0e3-d000221fc5ac', source: 'notion', body: '# Body' });
    });

    it('resolves null when no published post has the slug', async () => {
      queryResult([]);

      await expect(notionSource.getPostBySlug('missing')).resolves.toBeNull();
    });
  });

  describe('getSearchIndex', () => {
    it('reads every listed post, a Notion page of 100 at a time, mapped', async () => {
      (notion.dataSources.query as Mock)
        .mockResolvedValueOnce({ results: [notionPage()], has_more: true, next_cursor: 'c2' })
        .mockResolvedValueOnce({ results: [notionPage({}, { id: 'second' })], has_more: false, next_cursor: null });

      const posts = await notionSource.getSearchIndex();

      expect(notion.dataSources.query).toHaveBeenNthCalledWith(2, expect.objectContaining({ page_size: 100, start_cursor: 'c2' }));
      expect(posts.map(post => post.id)).toEqual(['7d3761f9-323d-4a15-a0e3-d000221fc5ac', 'second']);
    });

    it('rejects rather than return a partial index when Notion reports more without a cursor', async () => {
      (notion.dataSources.query as Mock).mockResolvedValue({ results: [notionPage()], has_more: true, next_cursor: null });

      await expect(notionSource.getSearchIndex()).rejects.toThrow('more posts without a cursor');
    });
  });
});
