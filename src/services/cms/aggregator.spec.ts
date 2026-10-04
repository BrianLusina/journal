import CMSAdapter from './CMSAdapter';
import { fetchMergedPosts, findPostBySlug } from './aggregator';

const post = (id: string, source: CMSSource, publishDate: string): UnifiedPost => ({
  id,
  source,
  title: id,
  slug: id,
  publishDate,
  tags: [],
  authors: [],
});

const page = (items: UnifiedPost[], overrides: Partial<PaginatedUnifiedPosts> = {}): PaginatedUnifiedPosts => ({
  items,
  total: items.length,
  limit: items.length,
  skip: 0,
  hasMore: false,
  ...overrides,
});

const adapter = (source: CMSSource, impl: Partial<CMSAdapter>): CMSAdapter => ({
  source,
  getPosts: jest.fn().mockResolvedValue(page([])),
  getPostBySlug: jest.fn().mockResolvedValue(null),
  ...impl,
});

describe('fetchMergedPosts', () => {
  it('asks every source for enough items to cover the requested page', async () => {
    const contentful = adapter('contentful', {});
    const notion = adapter('notion', {});

    await fetchMergedPosts([contentful, notion], { skip: 10, limit: 5, category: 'news' });

    expect(contentful.getPosts).toHaveBeenCalledWith({ category: 'news', skip: 0, limit: 15 });
    expect(notion.getPosts).toHaveBeenCalledWith({ category: 'news', skip: 0, limit: 15 });
  });

  it('merges sources newest first and then applies skip and limit', async () => {
    const contentful = adapter('contentful', {
      getPosts: jest.fn().mockResolvedValue(page([post('c1', 'contentful', '2024-03-01'), post('c2', 'contentful', '2024-01-01')])),
    });
    const notion = adapter('notion', {
      getPosts: jest.fn().mockResolvedValue(page([post('n1', 'notion', '2024-02-01')])),
    });

    const result = await fetchMergedPosts([contentful, notion], { skip: 1, limit: 1 });

    expect(result.items.map(item => item.id)).toEqual(['n1']);
    expect(result.skip).toBe(1);
    expect(result.limit).toBe(1);
    expect(result.total).toBe(3);
  });

  it('reports hasMore when merged items beyond the page were discarded', async () => {
    const contentful = adapter('contentful', {
      getPosts: jest.fn().mockResolvedValue(page([post('c1', 'contentful', '2024-03-01'), post('c2', 'contentful', '2024-01-01')])),
    });
    const notion = adapter('notion', {
      getPosts: jest.fn().mockResolvedValue(page([post('n1', 'notion', '2024-02-01')])),
    });

    const result = await fetchMergedPosts([contentful, notion], { limit: 2 });

    expect(result.items).toHaveLength(2);
    expect(result.hasMore).toBe(true);
  });

  it('reports hasMore when any source has more beyond what it returned', async () => {
    const contentful = adapter('contentful', {
      getPosts: jest.fn().mockResolvedValue(page([post('c1', 'contentful', '2024-03-01')], { hasMore: true })),
    });

    const result = await fetchMergedPosts([contentful], { limit: 1 });

    expect(result.hasMore).toBe(true);
  });

  it('reports no more posts when everything fits on the page', async () => {
    const contentful = adapter('contentful', {
      getPosts: jest.fn().mockResolvedValue(page([post('c1', 'contentful', '2024-03-01')])),
    });

    const result = await fetchMergedPosts([contentful], { limit: 10 });

    expect(result.hasMore).toBe(false);
  });

  it('still returns posts from healthy sources when one source fails', async () => {
    const failure = new Error('Notion is down');
    const contentful = adapter('contentful', {
      getPosts: jest.fn().mockResolvedValue(page([post('c1', 'contentful', '2024-03-01')])),
    });
    const notion = adapter('notion', { getPosts: jest.fn().mockRejectedValue(failure) });

    const result = await fetchMergedPosts([contentful, notion], { limit: 10 });

    expect(result.items.map(item => item.id)).toEqual(['c1']);
    expect(result.errors).toEqual([failure]);
  });

  it('throws when every source fails', async () => {
    const failure = new Error('Contentful is down');
    const contentful = adapter('contentful', { getPosts: jest.fn().mockRejectedValue(failure) });
    const notion = adapter('notion', { getPosts: jest.fn().mockRejectedValue(new Error('Notion is down')) });

    await expect(fetchMergedPosts([contentful, notion], {})).rejects.toBe(failure);
  });
});

describe('findPostBySlug', () => {
  it('prefers the first adapter in registration order when several have the slug', async () => {
    const contentfulPost = post('c1', 'contentful', '2024-01-01');
    const contentful = adapter('contentful', { getPostBySlug: jest.fn().mockResolvedValue(contentfulPost) });
    const notion = adapter('notion', { getPostBySlug: jest.fn().mockResolvedValue(post('n1', 'notion', '2024-01-01')) });

    await expect(findPostBySlug([contentful, notion], 'slug')).resolves.toBe(contentfulPost);
  });

  it('returns the post from a later source when an earlier one fails', async () => {
    const notionPost = post('n1', 'notion', '2024-01-01');
    const contentful = adapter('contentful', { getPostBySlug: jest.fn().mockRejectedValue(new Error('down')) });
    const notion = adapter('notion', { getPostBySlug: jest.fn().mockResolvedValue(notionPost) });

    await expect(findPostBySlug([contentful, notion], 'slug')).resolves.toBe(notionPost);
  });

  it('returns null when every source answers that the post does not exist', async () => {
    await expect(findPostBySlug([adapter('contentful', {}), adapter('notion', {})], 'missing')).resolves.toBeNull();
  });

  it('throws when the post was not found and a source failed, since it may exist there', async () => {
    const failure = new Error('Contentful is down');
    const contentful = adapter('contentful', { getPostBySlug: jest.fn().mockRejectedValue(failure) });

    await expect(findPostBySlug([contentful, adapter('notion', {})], 'slug')).rejects.toBe(failure);
  });
});
