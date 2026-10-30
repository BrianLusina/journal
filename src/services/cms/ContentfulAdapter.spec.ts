import ContentfulAdapter from './ContentfulAdapter';

const blogPost = (overrides: Record<string, unknown> = {}) => ({
  sys: { id: 'post-1', firstPublishedAt: '2024-01-02T10:00:00.000Z' },
  title: 'Title',
  subtitle: 'Subtitle',
  description: 'Description',
  category: 'Wellness',
  slug: 'title',
  body: '# Body',
  publishDate: '2024-01-01T10:00:00.000Z',
  heroImage: { url: 'https://images/hero.png', description: 'Hero', title: 'Hero title' },
  thumbnail: { url: 'https://images/thumb.png', description: 'Thumb', title: 'Thumb title' },
  contentfulMetadata: { tags: [{ id: 'mindfulness', name: 'Mindfulness' }] },
  authorsCollection: {
    items: [{ sys: { id: 'author-1' }, name: 'Ada', shortBio: 'Writes.', image: { url: 'https://images/ada.png' } }],
  },
  ...overrides,
});

const mockFetch = (status: number, body: unknown) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  }) as jest.Mock;
};

describe('ContentfulAdapter', () => {
  const adapter = new ContentfulAdapter();

  it('maps a Contentful blog post onto the unified post model', async () => {
    mockFetch(200, { results: [blogPost()], nextCursor: null });

    const { items } = await adapter.getPosts({ limit: 10 });

    expect(items[0]).toEqual({
      id: 'post-1',
      source: 'contentful',
      title: 'Title',
      subtitle: 'Subtitle',
      description: 'Description',
      category: 'Wellness',
      slug: 'title',
      body: '# Body',
      publishDate: '2024-01-01T10:00:00.000Z',
      heroImage: { url: 'https://images/hero.png', description: 'Hero', title: 'Hero title' },
      thumbnail: { url: 'https://images/thumb.png', description: 'Thumb', title: 'Thumb title' },
      tags: ['Mindfulness'],
      authors: [{ id: 'author-1', source: 'contentful', name: 'Ada', avatarUrl: 'https://images/ada.png', shortBio: 'Writes.' }],
    });
  });

  it('falls back to the first published date and tolerates missing images, tags and authors', async () => {
    mockFetch(200, {
      results: [
        blogPost({ publishDate: null, heroImage: null, thumbnail: null, contentfulMetadata: null, authorsCollection: null }),
      ],
      nextCursor: null,
    });

    const { items } = await adapter.getPosts({ limit: 10 });

    expect(items[0]).toMatchObject({
      publishDate: '2024-01-02T10:00:00.000Z',
      heroImage: undefined,
      thumbnail: undefined,
      tags: [],
      authors: [],
    });
  });

  it('shows the tags from both the Contentful tags and the legacy tags field, once each', async () => {
    mockFetch(200, { results: [blogPost({ tags: ['Mindfulness', 'Travel'] })], nextCursor: null });

    const { items } = await adapter.getPosts({ limit: 10 });

    expect(items[0].tags).toEqual(['Mindfulness', 'Travel']);
  });

  it('passes the request on to the posts route and returns its cursor', async () => {
    mockFetch(200, { results: [blogPost()], nextCursor: '3' });

    const result = await adapter.getPosts({ cursor: '2', limit: 1, category: 'Wellness', tag: 'Data Structures' });

    expect(global.fetch).toHaveBeenCalledWith('/api/contentful/posts?limit=1&category=Wellness&tag=Data+Structures&cursor=2');
    expect(result.nextCursor).toBe('3');
  });

  it('asks only for the limit without a cursor, category or tag', async () => {
    mockFetch(200, { results: [], nextCursor: null });

    await adapter.getPosts({ limit: 10 });

    expect(global.fetch).toHaveBeenCalledWith('/api/contentful/posts?limit=10');
  });

  it('rejects when the posts route fails', async () => {
    mockFetch(502, { error: 'Unable to fetch Contentful posts' });

    await expect(adapter.getPosts({ limit: 10 })).rejects.toThrow('Unable to fetch Contentful posts: 502');
  });

  it('finds a post by slug, encoding the slug in the path', async () => {
    mockFetch(200, { post: blogPost() });

    const post = await adapter.getPostBySlug('a title/with?chars');

    expect(global.fetch).toHaveBeenCalledWith('/api/contentful/posts/a%20title%2Fwith%3Fchars');
    expect(post?.id).toBe('post-1');
  });

  it('returns null when no post has the slug', async () => {
    mockFetch(404, { error: 'Post not found' });

    await expect(adapter.getPostBySlug('missing')).resolves.toBeNull();
  });

  it('rejects when the slug route fails', async () => {
    mockFetch(502, { error: 'Unable to fetch Contentful post' });

    await expect(adapter.getPostBySlug('title')).rejects.toThrow('Unable to fetch Contentful post: 502');
  });
});
