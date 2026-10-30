import type { VercelRequest, VercelResponse } from '@vercel/node';
import postsHandler from './posts';
import postHandler from './posts/[slug]';
import { getTagId, isContentfulConfigured, queryContentful } from './_shared';

jest.mock('./_shared', () => ({
  GET_BLOG_POSTS: 'GET_BLOG_POSTS',
  getTagId: jest.fn(),
  isContentfulConfigured: jest.fn(),
  queryContentful: jest.fn(),
}));

const response = () => {
  const res = { status: jest.fn(), json: jest.fn(), setHeader: jest.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
};

const request = (query: Record<string, string>, method = 'GET') => ({ method, query }) as unknown as VercelRequest;

const respondWith = (items: unknown[], total = items.length) =>
  (queryContentful as jest.Mock).mockResolvedValue({ blogPostCollection: { total, items } });

describe('Contentful API routes', () => {
  beforeEach(() => {
    (isContentfulConfigured as jest.Mock).mockReturnValue(true);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  describe('posts', () => {
    it('lists dated posts newest first, from the start, with the end of the list marked by a null cursor', async () => {
      respondWith([{ sys: { id: 'p1' } }, { sys: { id: 'p2' } }]);
      const res = response();

      await postsHandler(request({ limit: '10' }), res as unknown as VercelResponse);

      expect(queryContentful).toHaveBeenCalledWith('GET_BLOG_POSTS', {
        skip: 0,
        limit: 10,
        order: ['publishDate_DESC'],
        where: { publishDate_exists: true },
      });
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ results: [{ sys: { id: 'p1' } }, { sys: { id: 'p2' } }], nextCursor: null });
    });

    it('reads from the cursor offset and returns the next offset while posts remain', async () => {
      respondWith([{ sys: { id: 'p3' } }], 5);
      const res = response();

      await postsHandler(request({ limit: '1', cursor: '2', category: 'Wellness' }), res as unknown as VercelResponse);

      expect(queryContentful).toHaveBeenCalledWith(
        'GET_BLOG_POSTS',
        expect.objectContaining({ skip: 2, limit: 1, where: { publishDate_exists: true, category: 'Wellness' } }),
      );
      expect(res.json).toHaveBeenCalledWith({ results: [{ sys: { id: 'p3' } }], nextCursor: '3' });
    });

    it.each(['abc', '-1', '1.5', '1e2', '0x10', ' '])('answers 400 for the cursor %p', async cursor => {
      const res = response();

      await postsHandler(request({ cursor }), res as unknown as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(queryContentful).not.toHaveBeenCalled();
    });

    it('reads posts carrying the tag by name in the legacy field or by its ID in the Contentful tags', async () => {
      (getTagId as jest.Mock).mockResolvedValue('datastructures');
      respondWith([]);

      await postsHandler(request({ tag: 'Data Structures' }), response() as unknown as VercelResponse);

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

    it('reads the legacy field only, and caches the answer, when no Contentful tag has the name', async () => {
      (getTagId as jest.Mock).mockResolvedValue(undefined);
      respondWith([]);
      const res = response();

      await postsHandler(request({ tag: 'Kotlin' }), res as unknown as VercelResponse);

      expect(queryContentful).toHaveBeenCalledWith(
        'GET_BLOG_POSTS',
        expect.objectContaining({ where: { publishDate_exists: true, OR: [{ tags_contains_some: ['Kotlin'] }] } }),
      );
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    });

    it('reads the legacy field only, logs, and keeps the answer out of the edge cache, when the tag list cannot be fetched', async () => {
      (getTagId as jest.Mock).mockRejectedValue(new Error('Unable to fetch Contentful tags: 503'));
      respondWith([{ sys: { id: 'p1' } }]);
      const res = response();

      await postsHandler(request({ tag: 'Kotlin' }), res as unknown as VercelResponse);

      expect(queryContentful).toHaveBeenCalledWith(
        'GET_BLOG_POSTS',
        expect.objectContaining({ where: { publishDate_exists: true, OR: [{ tags_contains_some: ['Kotlin'] }] } }),
      );
      expect(console.error).toHaveBeenCalledWith('Unable to look up the Contentful tag', expect.any(Error));
      expect(res.setHeader).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ results: [{ sys: { id: 'p1' } }], nextCursor: null });
    });

    it('answers 502 when Contentful cannot be queried', async () => {
      (queryContentful as jest.Mock).mockRejectedValue(new Error('Unable to query Contentful: 429'));
      const res = response();

      await postsHandler(request({}), res as unknown as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.setHeader).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Unable to fetch Contentful posts', expect.any(Error));
    });
  });

  describe('post by slug', () => {
    it('finds a post by slug', async () => {
      respondWith([{ sys: { id: 'p1' } }]);
      const res = response();

      await postHandler(request({ slug: 'hello' }), res as unknown as VercelResponse);

      expect(queryContentful).toHaveBeenCalledWith('GET_BLOG_POSTS', { limit: 1, where: { slug: 'hello' } });
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
      expect(res.json).toHaveBeenCalledWith({ post: { sys: { id: 'p1' } } });
    });

    it('answers 404 when no post has the slug', async () => {
      respondWith([]);
      const res = response();

      await postHandler(request({ slug: 'missing' }), res as unknown as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('answers 400 without a slug', async () => {
      const res = response();

      await postHandler(request({}), res as unknown as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(queryContentful).not.toHaveBeenCalled();
    });

    it('answers 502 when Contentful cannot be queried', async () => {
      (queryContentful as jest.Mock).mockRejectedValue(new Error('Unable to query Contentful: 429'));
      const res = response();

      await postHandler(request({ slug: 'hello' }), res as unknown as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(502);
      expect(console.error).toHaveBeenCalledWith('Unable to fetch Contentful post', expect.any(Error));
    });
  });

  it.each([
    ['list', postsHandler, {}],
    ['slug', postHandler, { slug: 'hello' }],
  ])('answers 405 from the %s route for anything but GET', async (_, handler, query) => {
    const res = response();

    await handler(request(query, 'POST'), res as unknown as VercelResponse);

    expect(res.setHeader).toHaveBeenCalledWith('Allow', 'GET');
    expect(res.status).toHaveBeenCalledWith(405);
    expect(queryContentful).not.toHaveBeenCalled();
  });

  it('answers 500 from the list route when Contentful is not configured', async () => {
    (isContentfulConfigured as jest.Mock).mockReturnValue(false);
    const res = response();

    await postsHandler(request({}), res as unknown as VercelResponse);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(queryContentful).not.toHaveBeenCalled();
  });

  // Every source is asked for every slug, so an unconfigured source must not fail the lookup.
  it('answers 404 from the slug route when Contentful is not configured', async () => {
    (isContentfulConfigured as jest.Mock).mockReturnValue(false);
    const res = response();

    await postHandler(request({ slug: 'hello' }), res as unknown as VercelResponse);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(queryContentful).not.toHaveBeenCalled();
  });
});
