import contentfulClient from '@contentfulClient';
import ContentfulAdapter from './ContentfulAdapter';

jest.mock('@contentfulClient', () => ({
  __esModule: true,
  default: { query: jest.fn() },
  GET_ALL_BLOGS: 'GET_ALL_BLOGS',
  GET_BLOG: 'GET_BLOG',
}));

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
  authorsCollection: { items: [{ sys: { id: 'author-1' } }] },
  ...overrides,
});

const respondWith = (items: unknown[], total = items.length, limit = items.length) =>
  (contentfulClient.query as jest.Mock).mockResolvedValue({
    data: { blogPostCollection: { items, total, limit, skip: 0 } },
  });

describe('ContentfulAdapter', () => {
  const adapter = new ContentfulAdapter();

  it('maps a Contentful blog post onto the unified post model', async () => {
    respondWith([blogPost()]);

    const { items } = await adapter.getPosts();

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
      authors: [{ id: 'author-1', name: undefined, avatarUrl: undefined }],
    });
  });

  it('falls back to the first published date and tolerates missing images, tags and authors', async () => {
    respondWith([
      blogPost({ publishDate: null, heroImage: null, thumbnail: null, contentfulMetadata: null, authorsCollection: null }),
    ]);

    const { items } = await adapter.getPosts();

    expect(items[0]).toMatchObject({
      publishDate: '2024-01-02T10:00:00.000Z',
      heroImage: undefined,
      thumbnail: undefined,
      tags: [],
      authors: [],
    });
  });

  it('passes pagination and category filters to the query and reports whether more posts exist', async () => {
    respondWith([blogPost()], 5, 1);

    const result = await adapter.getPosts({ skip: 2, limit: 1, category: 'Wellness' });

    expect(contentfulClient.query).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { skip: 2, limit: 1, where: { category: 'Wellness' } } }),
    );
    expect(result).toMatchObject({ total: 5, skip: 2, hasMore: true });
  });

  it('finds a post by slug', async () => {
    respondWith([blogPost()]);

    const post = await adapter.getPostBySlug('title');

    expect(contentfulClient.query).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { limit: 1, where: { slug: 'title' } } }),
    );
    expect(post?.id).toBe('post-1');
  });

  it('returns null when no post has the slug', async () => {
    respondWith([]);

    await expect(adapter.getPostBySlug('missing')).resolves.toBeNull();
  });
});
