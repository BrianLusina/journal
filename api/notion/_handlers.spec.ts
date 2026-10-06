import type { VercelRequest, VercelResponse } from '@vercel/node';
import postsHandler from './posts';
import postHandler from './posts/[slug]';
import { getDataSourceId, notion } from './_shared';

jest.mock('./_shared', () => ({
  getDataSourceId: jest.fn(),
  getLimit: (value: unknown) => Number(value) || 100,
  isNotionConfigured: () => true,
  notion: { dataSources: { query: jest.fn(), retrieve: jest.fn() } },
}));
jest.mock('notion-to-md', () => ({
  NotionToMarkdown: jest.fn().mockImplementation(() => ({
    pageToMarkdown: jest.fn().mockResolvedValue([]),
    toMarkdownString: () => ({ parent: '# Body' }),
  })),
}));

const response = () => {
  const res = { status: jest.fn(), json: jest.fn(), setHeader: jest.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
};

const request = (query: Record<string, string>) => ({ method: 'GET', query }) as unknown as VercelRequest;

describe('Notion API routes', () => {
  beforeEach(() => {
    (getDataSourceId as jest.Mock).mockResolvedValue('ds-1');
  });

  it('lists one page of posts from the resolved data source', async () => {
    (notion.dataSources.query as jest.Mock).mockResolvedValue({ results: [{ id: 'p1' }], has_more: false, next_cursor: null });
    const res = response();

    await postsHandler(request({ limit: '10' }), res as unknown as VercelResponse);

    expect(notion.dataSources.query).toHaveBeenCalledTimes(1);
    expect(notion.dataSources.query).toHaveBeenCalledWith(
      expect.objectContaining({ data_source_id: 'ds-1', page_size: 10, start_cursor: undefined }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ results: [{ id: 'p1' }], nextCursor: null });
  });

  it('continues from the given cursor and returns the next one while Notion has more', async () => {
    (notion.dataSources.query as jest.Mock).mockResolvedValue({ results: [{ id: 'p2' }], has_more: true, next_cursor: 'cursor-3' });
    const res = response();

    await postsHandler(request({ limit: '1', cursor: 'cursor-2' }), res as unknown as VercelResponse);

    expect(notion.dataSources.query).toHaveBeenCalledWith(expect.objectContaining({ page_size: 1, start_cursor: 'cursor-2' }));
    expect(res.json).toHaveBeenCalledWith({ results: [{ id: 'p2' }], nextCursor: 'cursor-3' });
  });

  it.each([
    ['without a category', {}, []],
    ['with a category', { category: 'Travel' }, [{ property: 'Category', select: { equals: 'Travel' } }]],
  ])('lists only published posts that have a slug and a date, %s', async (_, query, extraFilters) => {
    (notion.dataSources.query as jest.Mock).mockResolvedValue({ results: [], has_more: false, next_cursor: null });

    await postsHandler(request(query), response() as unknown as VercelResponse);

    // A post without a slug cannot be opened: the slug route looks posts up by Slug.
    // A post without a date cannot be placed in the merged feed, which is ordered by Date.
    expect(notion.dataSources.query).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: {
          and: [
            { property: 'Status', status: { equals: 'Published' } },
            { property: 'Slug', rich_text: { is_not_empty: true } },
            { property: 'Date', date: { is_not_empty: true } },
            ...extraFilters,
          ],
        },
      }),
    );
  });

  it('lists posts carrying any Tags option whose slug matches the tag', async () => {
    (notion.dataSources.retrieve as jest.Mock).mockResolvedValue({
      properties: {
        Tags: {
          type: 'multi_select',
          multi_select: { options: [{ name: 'Personal Growth' }, { name: 'personal-growth' }, { name: 'Travel' }] },
        },
      },
    });
    (notion.dataSources.query as jest.Mock).mockResolvedValue({ results: [{ id: 'p1' }], has_more: false, next_cursor: null });
    const res = response();

    await postsHandler(request({ tag: 'personalGrowth' }), res as unknown as VercelResponse);

    expect(notion.dataSources.retrieve).toHaveBeenCalledWith({ data_source_id: 'ds-1' });
    const { filter } = (notion.dataSources.query as jest.Mock).mock.calls[0][0];
    expect(filter.and).toContainEqual({
      or: [
        { property: 'Tags', multi_select: { contains: 'Personal Growth' } },
        { property: 'Tags', multi_select: { contains: 'personal-growth' } },
      ],
    });
    expect(res.json).toHaveBeenCalledWith({ results: [{ id: 'p1' }], nextCursor: null });
  });

  it('answers with no posts, without querying, when no Tags option matches the tag', async () => {
    (notion.dataSources.retrieve as jest.Mock).mockResolvedValue({
      properties: { Tags: { type: 'multi_select', multi_select: { options: [{ name: 'Travel' }] } } },
    });
    const res = response();

    await postsHandler(request({ tag: 'personalGrowth' }), res as unknown as VercelResponse);

    expect(notion.dataSources.query).not.toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ results: [], nextCursor: null });
  });

  it('finds a post by slug in the resolved data source', async () => {
    (notion.dataSources.query as jest.Mock).mockResolvedValue({ results: [{ id: 'p1' }] });
    const res = response();

    await postHandler(request({ slug: 'hello' }), res as unknown as VercelResponse);

    expect(notion.dataSources.query).toHaveBeenCalledWith(expect.objectContaining({ data_source_id: 'ds-1' }));
    expect(res.json).toHaveBeenCalledWith({ page: { id: 'p1' }, body: '# Body' });
  });

  it.each([
    ['list', postsHandler, {}],
    ['slug', postHandler, { slug: 'hello' }],
  ])('answers 502 from the %s route when the data source cannot be resolved', async (_, handler, query) => {
    (getDataSourceId as jest.Mock).mockRejectedValue(new Error('Notion unavailable'));
    const res = response();

    await handler(request(query), res as unknown as VercelResponse);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(notion.dataSources.query).not.toHaveBeenCalled();
  });
});
