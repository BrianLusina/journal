import type { Mock } from 'vitest';
import { createApiAdapter } from './apiAdapter';

const post = { id: 'post-1', source: 'contentful', title: 'Title', slug: 'title', publishDate: '2024-01-01', tags: [], authors: [] };

const mockFetch = (status: number, body: unknown) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  }) as Mock;
};

describe('createApiAdapter', () => {
  const adapter = createApiAdapter('contentful');

  it('names its source', () => {
    expect(adapter.source).toBe('contentful');
  });

  it('passes the request on to the posts route and returns its page as it is', async () => {
    mockFetch(200, { results: [post], nextCursor: '3' });

    const page = await adapter.getPosts({ cursor: '2', limit: 1, category: 'Wellness', tag: 'Data Structures' });

    expect(global.fetch).toHaveBeenCalledWith('/api/contentful/posts?limit=1&category=Wellness&tag=Data+Structures&cursor=2');
    expect(page).toEqual({ items: [post], nextCursor: '3' });
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
    mockFetch(200, { post });

    await expect(adapter.getPostBySlug('a title/with?chars')).resolves.toEqual(post);
    expect(global.fetch).toHaveBeenCalledWith('/api/contentful/posts/a%20title%2Fwith%3Fchars');
  });

  it('returns null when no post has the slug', async () => {
    mockFetch(404, { error: 'Post not found' });

    await expect(adapter.getPostBySlug('missing')).resolves.toBeNull();
  });

  it('rejects when the slug route fails', async () => {
    mockFetch(502, { error: 'Unable to fetch Contentful post' });

    await expect(adapter.getPostBySlug('title')).rejects.toThrow('Unable to fetch Contentful post: 502');
  });

  it('reads the search index as it is', async () => {
    mockFetch(200, { results: [post] });

    await expect(adapter.getSearchIndex()).resolves.toEqual([post]);
    expect(global.fetch).toHaveBeenCalledWith('/api/contentful/search-index');
  });

  it('rejects when the search index route fails', async () => {
    mockFetch(502, { error: 'Unable to fetch the Contentful search index' });

    await expect(adapter.getSearchIndex()).rejects.toThrow('Unable to fetch the Contentful search index: 502');
  });

  it('names the source in its errors', async () => {
    mockFetch(502, {});

    await expect(createApiAdapter('notion').getPosts({ limit: 1 })).rejects.toThrow('Unable to fetch Notion posts: 502');
  });
});
