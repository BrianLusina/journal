import NotionAdapter from './NotionAdapter';

/*
 * Shaped like a page of the 📰 Journal CMS data source as the Notion API returns it, taken from
 * the real "Navigating Decision-Making in Engineering" row. That row is still a draft without a
 * slug, so the fixture fills both in, as they are on any post the routes list.
 */
const notionPage = (properties: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) => ({
  object: 'page',
  id: '7d3761f9-323d-4a15-a0e3-d000221fc5ac',
  created_time: '2024-02-06T10:12:00.000Z',
  cover: null,
  properties: {
    Title: {
      id: 'title',
      type: 'title',
      title: [
        {
          type: 'text',
          text: { content: 'Navigating Decision-Making in Engineering: A Framework-Centric Approach', link: null },
          annotations: { bold: true },
          plain_text: 'Navigating Decision-Making in Engineering: A Framework-Centric Approach',
          href: null,
        },
      ],
    },
    Slug: { type: 'rich_text', rich_text: [{ type: 'text', plain_text: 'navigating-decision-making' }] },
    Description: {
      type: 'rich_text',
      rich_text: [{ type: 'text', annotations: { bold: true }, plain_text: 'A Framework-Centric Approach' }],
    },
    Categories: {
      type: 'multi_select',
      multi_select: [{ id: 'V0tG', name: 'engineering strategy 101', color: 'brown' }],
    },
    Published: { type: 'date', date: { start: '2024-02-07T04:00:00.000+00:00', end: null, time_zone: null } },
    Status: { type: 'status', status: { id: 'pub', name: 'Published', color: 'green' } },
    Tags: {
      type: 'multi_select',
      multi_select: [
        { id: 'W19P', name: 'Decision', color: 'gray' },
        { id: 'W19Q', name: 'Framework', color: 'pink' },
      ],
    },
    // A text property whose value is a mention of a workspace member.
    Authors: {
      type: 'rich_text',
      rich_text: [
        {
          type: 'mention',
          mention: { type: 'user', user: { object: 'user', id: '9ed22509-8f08-4e1b-a58f-3215e7e5d2a7' } },
          plain_text: '@Brian Lusina',
        },
      ],
    },
    "Cover Image": {
      type: 'files',
      files: [
        {
          name: 'decision.png',
          type: 'file',
          file: { url: 'https://prod-files-secure.s3.us-west-2.amazonaws.com/decision.png', expiry_time: '2026-10-15T11:00:00.000Z' },
        },
      ],
    },
    canonical_url: { type: 'url', url: null },
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

  it('maps a Journal CMS page onto the unified post model', async () => {
    mockFetch(200, { results: [notionPage()], nextCursor: null });

    const { items } = await adapter.getPosts({ limit: 10 });

    const cover = { url: 'https://prod-files-secure.s3.us-west-2.amazonaws.com/decision.png', title: 'Cover Image' };
    expect(items[0]).toEqual({
      id: '7d3761f9-323d-4a15-a0e3-d000221fc5ac',
      source: 'notion',
      title: 'Navigating Decision-Making in Engineering: A Framework-Centric Approach',
      slug: 'navigating-decision-making',
      description: 'A Framework-Centric Approach',
      category: 'engineering strategy 101',
      publishDate: '2024-02-07T04:00:00.000+00:00',
      heroImage: cover,
      thumbnail: cover,
      tags: ['Decision', 'Framework'],
      authors: [{ id: 'notion-author', source: 'notion', name: 'Brian Lusina' }],
    });
  });

  it('joins text split across segments and reads an external cover image', async () => {
    mockFetch(200, {
      results: [
        notionPage({
          // Notion splits text wherever its formatting changes.
          Title: { type: 'title', title: [{ plain_text: 'Clean code is ' }, { plain_text: 'not mandatory' }] },
          // The slug route matches the whole slug text, so every segment must be part of the link.
          Slug: { type: 'rich_text', rich_text: [{ plain_text: 'clean-code-' }, { plain_text: 'is-not-mandatory' }] },
          Description: { type: 'rich_text', rich_text: [{ plain_text: 'On ' }, { plain_text: 'craft' }] },
          Authors: { type: 'rich_text', rich_text: [{ type: 'text', plain_text: 'kanekotic' }] },
          "Cover Image": {
            type: 'files',
            files: [{ name: 'cover.png', type: 'external', external: { url: 'https://images/cover.png' } }],
          },
        }),
      ],
      nextCursor: null,
    });

    const { items } = await adapter.getPosts({ limit: 10 });

    expect(items[0]).toMatchObject({
      title: 'Clean code is not mandatory',
      slug: 'clean-code-is-not-mandatory',
      description: 'On craft',
      heroImage: { url: 'https://images/cover.png', title: 'Cover Image' },
      authors: [{ id: 'notion-author', source: 'notion', name: 'kanekotic' }],
    });
  });

  it('falls back when title, description, category, date, tags, authors and cover image are empty', async () => {
    mockFetch(200, {
      results: [
        notionPage({
          Title: { type: 'title', title: [] },
          Description: { type: 'rich_text', rich_text: [] },
          Categories: { type: 'multi_select', multi_select: [] },
          Published: { type: 'date', date: null },
          Tags: { type: 'multi_select', multi_select: [] },
          Authors: { type: 'rich_text', rich_text: [] },
          "Cover Image": { type: 'files', files: [] },
        }),
      ],
      nextCursor: null,
    });

    const { items } = await adapter.getPosts({ limit: 10 });

    expect(items[0]).toEqual({
      id: '7d3761f9-323d-4a15-a0e3-d000221fc5ac',
      source: 'notion',
      title: 'Untitled',
      slug: 'navigating-decision-making',
      description: undefined,
      category: undefined,
      publishDate: '2024-02-06T10:12:00.000Z',
      heroImage: undefined,
      thumbnail: undefined,
      tags: [],
      authors: [],
    });
  });

  it('requests the page after the cursor from the API route and passes on its next cursor', async () => {
    mockFetch(200, { results: [notionPage({}, { id: 'a' }), notionPage({}, { id: 'b' })], nextCursor: 'cursor-2' });

    const result = await adapter.getPosts({ cursor: 'cursor-1', limit: 2, category: 'Travel' });

    expect(global.fetch).toHaveBeenCalledWith('/api/notion/posts?limit=2&category=Travel&cursor=cursor-1');
    expect(result.items.map(item => item.id)).toEqual(['a', 'b']);
    expect(result.nextCursor).toBe('cursor-2');
  });

  it('passes the tag to the API route', async () => {
    mockFetch(200, { results: [], nextCursor: null });

    await adapter.getPosts({ limit: 5, tag: 'personalGrowth' });

    expect(global.fetch).toHaveBeenCalledWith('/api/notion/posts?limit=5&tag=personalGrowth');
  });

  it('requests the first page without a cursor', async () => {
    mockFetch(200, { results: [], nextCursor: null });

    const result = await adapter.getPosts({ limit: 5 });

    expect(global.fetch).toHaveBeenCalledWith('/api/notion/posts?limit=5');
    expect(result).toEqual({ items: [], nextCursor: null });
  });

  it('throws when the API route fails', async () => {
    mockFetch(502, { error: 'Unable to fetch Notion posts' });

    await expect(adapter.getPosts({ limit: 5 })).rejects.toThrow('Unable to fetch Notion posts: 502');
  });

  it('returns a post with its markdown body by slug', async () => {
    mockFetch(200, { page: notionPage(), body: '# Hello' });

    const post = await adapter.getPostBySlug('notion title');

    expect(global.fetch).toHaveBeenCalledWith('/api/notion/posts/notion%20title');
    expect(post).toMatchObject({ id: '7d3761f9-323d-4a15-a0e3-d000221fc5ac', body: '# Hello' });
  });

  it('returns null when the API route reports the slug does not exist', async () => {
    mockFetch(404, { error: 'Post not found' });

    await expect(adapter.getPostBySlug('missing')).resolves.toBeNull();
  });
});
