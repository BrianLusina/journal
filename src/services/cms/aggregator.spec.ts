import CMSAdapter from './CMSAdapter';
import { createMergedFeed, findPostBySlug, type MergedPosts } from './aggregator';

const post = (id: string, source: CMSSource, publishDate: string): UnifiedPost => ({
  id,
  source,
  title: id,
  slug: id,
  publishDate,
  tags: [],
  authors: [],
});

const adapter = (source: CMSSource, impl: Partial<CMSAdapter>): CMSAdapter => ({
  source,
  getPosts: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
  getPostBySlug: jest.fn().mockResolvedValue(null),
  ...impl,
});

/**
 * An adapter serving `posts` (newest first) a page at a time, with the offset as its cursor and
 * at most 100 posts per page like the Notion API, recording every request.
 */
const pagedAdapter = (source: CMSSource, posts: UnifiedPost[]) => {
  const getPosts = jest.fn(async ({ cursor, limit }: CMSPageRequest): Promise<CMSPage> => {
    const start = cursor ? Number(cursor) : 0;
    const end = start + Math.min(limit, 100);
    return { items: posts.slice(start, end), nextCursor: end < posts.length ? String(end) : null };
  });
  return adapter(source, { getPosts });
};

const ids = (feed: MergedPosts) => feed.items.map(item => item.id);

const cursors = (source: CMSAdapter) => (source.getPosts as jest.Mock).mock.calls.map(([request]) => request.cursor);

/** `count` posts from `source`, one day apart, newest first. */
const dated = (prefix: string, source: CMSSource, count: number) =>
  Array.from({ length: count }, (_, index) =>
    post(`${prefix}${index}`, source, new Date(Date.UTC(2024, 0, 1) - index * 86400000).toISOString()),
  );

describe('createMergedFeed', () => {
  const contentful = () =>
    pagedAdapter('contentful', [post('c1', 'contentful', '2024-05-01'), post('c2', 'contentful', '2024-03-01'), post('c3', 'contentful', '2024-01-01')]);
  const notion = () =>
    pagedAdapter('notion', [post('n1', 'notion', '2024-04-01'), post('n2', 'notion', '2024-02-01')]);

  it('merges every source newest first', async () => {
    const feed = createMergedFeed([contentful(), notion()]);

    const result = await feed.load(4);

    expect(ids(result)).toEqual(['c1', 'n1', 'c2', 'n2']);
    expect(result.hasMore).toBe(true);
  });

  it('reports no more posts once every source is exhausted', async () => {
    const feed = createMergedFeed([contentful(), notion()]);

    const result = await feed.load(10);

    expect(ids(result)).toEqual(['c1', 'n1', 'c2', 'n2', 'c3']);
    expect(result.hasMore).toBe(false);
  });

  it('continues from each source cursor instead of refetching from the start', async () => {
    const c = pagedAdapter('contentful', dated('c', 'contentful', 15));
    const n = notion();
    const feed = createMergedFeed([c, n]);

    await feed.load(2);
    const result = await feed.load(14);

    expect(result.items).toHaveLength(14);
    expect(cursors(c)).toEqual([undefined, '10']);
    expect(cursors(n)).toEqual([undefined]);
  });

  it('asks each source for at least a minimum page so small loads do not fetch post by post', async () => {
    const c = contentful();
    const feed = createMergedFeed([c]);

    await feed.load(1);

    expect(c.getPosts).toHaveBeenCalledWith(expect.objectContaining({ limit: 10 }));
  });

  it('reads past an empty page that still has a next cursor', async () => {
    const getPosts = jest
      .fn()
      .mockResolvedValueOnce({ items: [], nextCursor: 'next' })
      .mockResolvedValueOnce({ items: [post('n1', 'notion', '2024-06-01')], nextCursor: null });
    const feed = createMergedFeed([contentful(), adapter('notion', { getPosts })]);

    const result = await feed.load(2);

    expect(ids(result)).toEqual(['n1', 'c1']);
  });

  it('shows a post once even when consecutive pages overlap', async () => {
    const getPosts = jest
      .fn()
      .mockResolvedValueOnce({ items: [post('n1', 'notion', '2024-04-01')], nextCursor: '1' })
      .mockResolvedValueOnce({ items: [post('n1', 'notion', '2024-04-01'), post('n2', 'notion', '2024-02-01')], nextCursor: null });
    const feed = createMergedFeed([adapter('notion', { getPosts })]);

    const result = await feed.load(10);

    expect(ids(result)).toEqual(['n1', 'n2']);
  });

  it('reaches posts beyond any single page size', async () => {
    const feed = createMergedFeed([pagedAdapter('notion', dated('n', 'notion', 250))]);

    const result = await feed.load(250);

    expect(result.items).toHaveLength(250);
    expect(result.items[249].id).toBe('n249');
    expect(result.hasMore).toBe(false);
  });

  it('passes the category and tag to every source', async () => {
    const c = contentful();
    const n = notion();
    const feed = createMergedFeed([c, n], { category: 'Travel', tag: 'personalGrowth' });

    await feed.load(1);

    expect(c.getPosts).toHaveBeenCalledWith(expect.objectContaining({ category: 'Travel', tag: 'personalGrowth' }));
    expect(n.getPosts).toHaveBeenCalledWith(expect.objectContaining({ category: 'Travel', tag: 'personalGrowth' }));
  });

  it('serializes overlapping loads so a cursor is never fetched twice', async () => {
    const c = contentful();
    const feed = createMergedFeed([c]);

    const [first, second] = await Promise.all([feed.load(1), feed.load(2)]);

    expect(ids(first)).toEqual(['c1']);
    expect(ids(second)).toEqual(['c1', 'c2']);
    expect(new Set(cursors(c)).size).toBe(cursors(c).length);
  });

  it('keeps serving healthy sources when one source fails, and reports the failure', async () => {
    const failure = new Error('Notion is down');
    const feed = createMergedFeed([contentful(), adapter('notion', { getPosts: jest.fn().mockRejectedValue(failure) })]);

    const result = await feed.load(3);

    expect(ids(result)).toEqual(['c1', 'c2', 'c3']);
    expect(result.errors).toEqual([failure]);
    expect(result.hasMore).toBe(true);
  });

  it('retries a failed source on the next load from where it stopped', async () => {
    const failure = new Error('Notion is down');
    const getPosts = jest
      .fn()
      .mockResolvedValueOnce({ items: [post('n1', 'notion', '2024-04-01')], nextCursor: '1' })
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce({ items: [post('n2', 'notion', '2024-02-01')], nextCursor: null });
    const feed = createMergedFeed([adapter('notion', { getPosts })]);

    const first = await feed.load(2);
    const second = await feed.load(2);

    expect(ids(first)).toEqual(['n1']);
    expect(first.errors).toEqual([failure]);
    expect(ids(second)).toEqual(['n1', 'n2']);
    expect(second.errors).toEqual([]);
    expect(getPosts.mock.calls.map(([request]) => request.cursor)).toEqual([undefined, '1', '1']);
  });

  it('resolves empty rather than failing when one source has no posts and another fails', async () => {
    const failure = new Error('Notion is down');
    const feed = createMergedFeed([adapter('contentful', {}), adapter('notion', { getPosts: jest.fn().mockRejectedValue(failure) })]);

    const result = await feed.load(2);

    expect(result.items).toEqual([]);
    expect(result.errors).toEqual([failure]);
  });

  it('throws when every source fails', async () => {
    const failure = new Error('Contentful is down');
    const feed = createMergedFeed([
      adapter('contentful', { getPosts: jest.fn().mockRejectedValue(failure) }),
      adapter('notion', { getPosts: jest.fn().mockRejectedValue(new Error('Notion is down')) }),
    ]);

    await expect(feed.load(2)).rejects.toBe(failure);
  });

  it('throws again on a later load while every source is still failing', async () => {
    const failure = new Error('Contentful is down');
    const feed = createMergedFeed([adapter('contentful', { getPosts: jest.fn().mockRejectedValue(failure) })]);

    await expect(feed.load(2)).rejects.toBe(failure);
    await expect(feed.load(2)).rejects.toBe(failure);
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
