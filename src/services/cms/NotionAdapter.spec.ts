import NotionAdapter from './NotionAdapter';

const notionPage = (properties: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) => ({
  id: 'page-1',
  created_time: '2024-01-05T00:00:00.000Z',
  cover: { type: 'external', external: { url: 'https://images/cover.png' } },
  properties: {
    Title: { title: [{ plain_text: 'Notion title' }] },
    Slug: { rich_text: [{ plain_text: 'notion-title' }] },
    Description: { rich_text: [{ plain_text: 'Notion description' }] },
    Category: { select: { name: 'Travel' } },
    Date: { date: { start: '2024-02-01' } },
    Tags: { multi_select: [{ name: 'Hiking' }, { name: 'Alps' }] },
    Author: { people: [{ id: 'user-1', name: 'Ada', avatar_url: 'https://images/ada.png' }] },
    ...properties,
  },
  ...extra,
});

const mockFetch = (status: number, body: unknown) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  }) as jest.Mock;
};

describe('NotionAdapter', () => {
  const adapter = new NotionAdapter();

  it('maps a Notion page onto the unified post model', async () => {
    mockFetch(200, { results: [notionPage()], hasMore: false });

    const { items } = await adapter.getPosts();

    expect(items[0]).toEqual({
      id: 'page-1',
      source: 'notion',
      title: 'Notion title',
      slug: 'notion-title',
      description: 'Notion description',
      category: 'Travel',
      publishDate: '2024-02-01',
      heroImage: { url: 'https://images/cover.png', title: 'Cover Image' },
      thumbnail: { url: 'https://images/cover.png', title: 'Cover Image' },
      tags: ['Hiking', 'Alps'],
      authors: [{ id: 'user-1', source: 'notion', name: 'Ada', avatarUrl: 'https://images/ada.png' }],
    });
  });

  it('falls back for missing title, slug, date, cover and people authors', async () => {
    mockFetch(200, {
      results: [
        notionPage(
          {
            Title: { title: [] },
            Slug: { rich_text: [] },
            Date: { date: null },
            Author: { rich_text: [{ plain_text: 'Guest ' }, { plain_text: 'writer' }] },
          },
          { cover: { type: 'file', file: { url: 'https://files/cover.png' } } },
        ),
      ],
      hasMore: false,
    });

    const { items } = await adapter.getPosts();

    expect(items[0]).toMatchObject({
      title: 'Untitled',
      slug: 'page-1',
      publishDate: '2024-01-05T00:00:00.000Z',
      heroImage: { url: 'https://files/cover.png', title: 'Cover Image' },
      authors: [{ id: 'notion-author', source: 'notion', name: 'Guest writer' }],
    });
  });

  it('requests enough posts to cover the page from the API route and returns the requested slice', async () => {
    mockFetch(200, { results: [notionPage({}, { id: 'a' }), notionPage({}, { id: 'b' }), notionPage({}, { id: 'c' })], hasMore: true });

    const result = await adapter.getPosts({ skip: 1, limit: 2, category: 'Travel' });

    expect(global.fetch).toHaveBeenCalledWith('/api/notion/posts?limit=3&category=Travel');
    expect(result.items.map(item => item.id)).toEqual(['b', 'c']);
    expect(result).toMatchObject({ skip: 1, limit: 2, hasMore: true });
  });

  it('throws when the API route fails', async () => {
    mockFetch(502, { error: 'Unable to fetch Notion posts' });

    await expect(adapter.getPosts()).rejects.toThrow('Unable to fetch Notion posts: 502');
  });

  it('returns a post with its markdown body by slug', async () => {
    mockFetch(200, { page: notionPage(), body: '# Hello' });

    const post = await adapter.getPostBySlug('notion title');

    expect(global.fetch).toHaveBeenCalledWith('/api/notion/posts/notion%20title');
    expect(post).toMatchObject({ id: 'page-1', body: '# Hello' });
  });

  it('returns null when the API route reports the slug does not exist', async () => {
    mockFetch(404, { error: 'Post not found' });

    await expect(adapter.getPostBySlug('missing')).resolves.toBeNull();
  });
});
