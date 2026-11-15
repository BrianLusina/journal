import type { Mock } from 'vitest';
import { getTagId, queryContentful } from './client';
import { contentfulSource } from './source';
import { contentfulPost } from './__fixtures__';

vi.mock('./client', () => ({
  GET_BLOG_POSTS: 'GET_BLOG_POSTS',
  GET_SEARCH_INDEX: 'GET_SEARCH_INDEX',
  getTagId: vi.fn(),
  queryContentful: vi.fn(),
}));

const respondWith = (items: unknown[], total = items.length) =>
  (queryContentful as Mock).mockResolvedValue({ blogPostCollection: { total, items } });

const items = (from: number, count: number) =>
  Array.from({ length: count }, (_, index) => contentfulPost({ sys: { id: `p${from + index}`, firstPublishedAt: '2024-01-01' } }));

describe('contentfulSource', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  describe('getPosts', () => {
    it('reads dated posts newest first from the start, mapped, with a null cursor at the end', async () => {
      respondWith([contentfulPost()]);

      const page = await contentfulSource.getPosts({ limit: 10 });

      expect(queryContentful).toHaveBeenCalledWith('GET_BLOG_POSTS', {
        skip: 0,
        limit: 10,
        order: ['publishDate_DESC'],
        where: { publishDate_exists: true },
      });
      expect(page.items.map(post => [post.id, post.source])).toEqual([['post-1', 'contentful']]);
      expect(page.nextCursor).toBeNull();
      expect(page.partial).toBeUndefined();
    });

    it('reads from the cursor offset and returns the next offset while posts remain', async () => {
      respondWith(items(2, 1), 5);

      const page = await contentfulSource.getPosts({ limit: 1, cursor: '2', category: 'Wellness' });

      expect(queryContentful).toHaveBeenCalledWith(
        'GET_BLOG_POSTS',
        expect.objectContaining({ skip: 2, limit: 1, where: { publishDate_exists: true, category: 'Wellness' } }),
      );
      expect(page.nextCursor).toBe('3');
    });

    it.each(['abc', '-1', '1.5', '1e2', '0x10', ' '])('rejects the cursor %p without querying Contentful', async cursor => {
      await expect(contentfulSource.getPosts({ limit: 1, cursor })).rejects.toThrow('Invalid cursor');
      expect(queryContentful).not.toHaveBeenCalled();
    });

    it('reads posts carrying the tag by name in the legacy field or by its ID in the Contentful tags', async () => {
      (getTagId as Mock).mockResolvedValue('datastructures');
      respondWith([]);

      await contentfulSource.getPosts({ limit: 10, tag: 'Data Structures' });

      expect(getTagId).toHaveBeenCalledWith('Data Structures');
      expect(queryContentful).toHaveBeenCalledWith(
        'GET_BLOG_POSTS',
        expect.objectContaining({
          where: {
            publishDate_exists: true,
            OR: [
              { tags_contains_some: ['Data Structures'] },
              { contentfulMetadata: { tags: { id_contains_some: ['datastructures'] } } },
            ],
          },
        }),
      );
    });

    it('reads the legacy field only, as a complete answer, when no Contentful tag has the name', async () => {
      (getTagId as Mock).mockResolvedValue(undefined);
      respondWith([]);

      const page = await contentfulSource.getPosts({ limit: 10, tag: 'Kotlin' });

      expect(queryContentful).toHaveBeenCalledWith(
        'GET_BLOG_POSTS',
        expect.objectContaining({ where: { publishDate_exists: true, OR: [{ tags_contains_some: ['Kotlin'] }] } }),
      );
      expect(page.partial).toBeUndefined();
    });

    it('reads the legacy field only, logs, and marks the answer partial, when the tag list cannot be fetched', async () => {
      (getTagId as Mock).mockRejectedValue(new Error('Unable to fetch Contentful tags: 503'));
      respondWith([contentfulPost()]);

      const page = await contentfulSource.getPosts({ limit: 10, tag: 'Kotlin' });

      expect(queryContentful).toHaveBeenCalledWith(
        'GET_BLOG_POSTS',
        expect.objectContaining({ where: { publishDate_exists: true, OR: [{ tags_contains_some: ['Kotlin'] }] } }),
      );
      expect(console.error).toHaveBeenCalledWith('Unable to look up the Contentful tag', expect.any(Error));
      expect(page.partial).toBe(true);
      expect(page.items).toHaveLength(1);
    });
  });

  describe('getPostBySlug', () => {
    it('finds a post by slug, mapped with its body', async () => {
      respondWith([contentfulPost()]);

      const post = await contentfulSource.getPostBySlug('title');

      expect(queryContentful).toHaveBeenCalledWith('GET_BLOG_POSTS', { limit: 1, where: { slug: 'title' } });
      expect(post).toMatchObject({ id: 'post-1', source: 'contentful', body: '# Body' });
    });

    it('resolves null when no post has the slug', async () => {
      respondWith([]);

      await expect(contentfulSource.getPostBySlug('missing')).resolves.toBeNull();
    });
  });

  describe('getSearchIndex', () => {
    it('reads every dated post, a page of 100 at a time, past the first page, mapped', async () => {
      (queryContentful as Mock)
        .mockResolvedValueOnce({ blogPostCollection: { total: 230, items: items(0, 100) } })
        .mockResolvedValueOnce({ blogPostCollection: { total: 230, items: items(100, 100) } })
        .mockResolvedValueOnce({ blogPostCollection: { total: 230, items: items(200, 30) } });

      const posts = await contentfulSource.getSearchIndex();

      [0, 100, 200].forEach((skip, call) =>
        expect(queryContentful).toHaveBeenNthCalledWith(call + 1, 'GET_SEARCH_INDEX', {
          skip,
          limit: 100,
          order: ['publishDate_DESC'],
          where: { publishDate_exists: true },
        }),
      );
      expect(posts).toHaveLength(230);
      expect(posts[229]).toMatchObject({ id: 'p229', source: 'contentful' });
    });

    it('rejects rather than return a partial index when a page comes back empty before the total', async () => {
      (queryContentful as Mock)
        .mockResolvedValueOnce({ blogPostCollection: { total: 150, items: items(0, 100) } })
        .mockResolvedValueOnce({ blogPostCollection: { total: 150, items: [] } });

      await expect(contentfulSource.getSearchIndex()).rejects.toThrow('empty page before the end');
      expect(queryContentful).toHaveBeenCalledTimes(2);
    });
  });
});
