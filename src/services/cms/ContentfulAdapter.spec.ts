import contentfulClient, { getTagId } from '@contentfulClient';
import ContentfulAdapter from './ContentfulAdapter';

jest.mock('@contentfulClient', () => ({
  __esModule: true,
  default: { query: jest.fn() },
  getTagId: jest.fn(),
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
  authorsCollection: {
    items: [{ sys: { id: 'author-1' }, name: 'Ada', shortBio: 'Writes.', image: { url: 'https://images/ada.png' } }],
  },
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
    respondWith([
      blogPost({ publishDate: null, heroImage: null, thumbnail: null, contentfulMetadata: null, authorsCollection: null }),
    ]);

    const { items } = await adapter.getPosts({ limit: 10 });

    expect(items[0]).toMatchObject({
      publishDate: '2024-01-02T10:00:00.000Z',
      heroImage: undefined,
      thumbnail: undefined,
      tags: [],
      authors: [],
    });
  });

  it('reads dated posts at the cursor offset, newest first, and returns the next offset as the cursor', async () => {
    respondWith([blogPost()], 5, 1);

    const result = await adapter.getPosts({ cursor: '2', limit: 1, category: 'Wellness' });

    expect(contentfulClient.query).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { skip: 2, limit: 1, order: ['publishDate_DESC'], where: { publishDate_exists: true, category: 'Wellness' } },
      }),
    );
    expect(result.nextCursor).toBe('3');
  });

  it('shows the tags from both the Contentful tags and the legacy tags field, once each', async () => {
    respondWith([blogPost({ tags: ['Mindfulness', 'Travel'] })]);

    const { items } = await adapter.getPosts({ limit: 10 });

    expect(items[0].tags).toEqual(['Mindfulness', 'Travel']);
  });

  it('reads posts carrying the tag by name in the legacy field or by its ID in the Contentful tags', async () => {
    (getTagId as jest.Mock).mockResolvedValue('datastructures');
    respondWith([blogPost()], 1, 10);

    await adapter.getPosts({ limit: 10, tag: 'Data Structures' });

    expect(getTagId).toHaveBeenCalledWith('Data Structures');
    expect(contentfulClient.query).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          where: {
            publishDate_exists: true,
            OR: [
              { tags_contains_some: ['Data Structures'] },
              { contentfulMetadata: { tags: { id_contains_some: ['datastructures'] } } },
            ],
          },
        }),
      }),
    );
  });

  it('still reads the legacy field when the Contentful tag list cannot be fetched', async () => {
    (getTagId as jest.Mock).mockRejectedValue(new Error('Unable to fetch Contentful tags: 503'));
    respondWith([blogPost()], 1, 10);

    await adapter.getPosts({ limit: 10, tag: 'Kotlin' });

    expect(contentfulClient.query).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          where: { publishDate_exists: true, OR: [{ tags_contains_some: ['Kotlin'] }] },
        }),
      }),
    );
  });

  it('reads the legacy field only when no Contentful tag has the name', async () => {
    (getTagId as jest.Mock).mockResolvedValue(undefined);
    respondWith([blogPost()], 1, 10);

    await adapter.getPosts({ limit: 10, tag: 'Browsers' });

    expect(contentfulClient.query).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          where: { publishDate_exists: true, OR: [{ tags_contains_some: ['Browsers'] }] },
        }),
      }),
    );
  });

  it('starts at the first post without a cursor and ends with a null cursor', async () => {
    respondWith([blogPost(), blogPost({ sys: { id: 'post-2' } })], 2, 10);

    const result = await adapter.getPosts({ limit: 10 });

    expect(contentfulClient.query).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { skip: 0, limit: 10, order: ['publishDate_DESC'], where: { publishDate_exists: true } },
      }),
    );
    expect(result.nextCursor).toBeNull();
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
