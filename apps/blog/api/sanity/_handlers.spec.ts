import type { Mock } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isSanityConfigured, sanitySource } from '@brianlusina/cms/server';
import postsHandler from './posts';
import postHandler from './posts/[slug]';

vi.mock('@brianlusina/cms/server', () => ({
  isSanityConfigured: vi.fn(),
  sanitySource: { getPosts: vi.fn(), getPostBySlug: vi.fn() },
}));

const CACHE = 's-maxage=60, stale-while-revalidate=300';

const response = () => {
  const res = { status: vi.fn(), json: vi.fn(), setHeader: vi.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
};

const request = (query: Record<string, string>, method = 'GET') => ({ method, query }) as unknown as VercelRequest;

const post = (id: string) => ({ id, source: 'sanity', title: id, slug: id, publishDate: '2024-01-01', tags: [], authors: [] });

describe('Sanity API routes', () => {
  beforeEach(() => {
    (isSanityConfigured as Mock).mockReturnValue(true);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  describe('posts', () => {
    it('answers a page of unified posts with its cursor, cached at the edge', async () => {
      (sanitySource.getPosts as Mock).mockResolvedValue({ items: [post('p1')], nextCursor: '4' });
      const res = response();

      await postsHandler(request({ limit: '1', cursor: '2', category: 'Travel', tag: 'Framework' }), res as unknown as VercelResponse);

      expect(sanitySource.getPosts).toHaveBeenCalledWith({ limit: 1, cursor: '2', category: 'Travel', tag: 'Framework' });
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', CACHE);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ results: [post('p1')], nextCursor: '4' });
    });

    it('passes no cursor, category or tag the request does not have', async () => {
      (sanitySource.getPosts as Mock).mockResolvedValue({ items: [], nextCursor: null });

      await postsHandler(request({}), response() as unknown as VercelResponse);

      expect(sanitySource.getPosts).toHaveBeenCalledWith({ limit: 100 });
    });

    it('answers 400 for a cursor that is not an offset, without querying', async () => {
      const res = response();

      await postsHandler(request({ cursor: 'abc' }), res as unknown as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(sanitySource.getPosts).not.toHaveBeenCalled();
    });

    it('answers 502 when Sanity cannot be queried', async () => {
      (sanitySource.getPosts as Mock).mockRejectedValue(new Error('Sanity unavailable'));
      const res = response();

      await postsHandler(request({}), res as unknown as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.setHeader).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Unable to fetch Sanity posts', expect.any(Error));
    });

    it('answers 500 when Sanity is not configured', async () => {
      (isSanityConfigured as Mock).mockReturnValue(false);
      const res = response();

      await postsHandler(request({}), res as unknown as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(sanitySource.getPosts).not.toHaveBeenCalled();
    });
  });

  describe('post by slug', () => {
    it('answers the unified post with its body, cached at the edge', async () => {
      const found = { ...post('hello'), body: '# Body' };
      (sanitySource.getPostBySlug as Mock).mockResolvedValue(found);
      const res = response();

      await postHandler(request({ slug: 'hello' }), res as unknown as VercelResponse);

      expect(sanitySource.getPostBySlug).toHaveBeenCalledWith('hello');
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', CACHE);
      expect(res.json).toHaveBeenCalledWith({ post: found });
    });

    it('answers 404 when no published post has the slug', async () => {
      (sanitySource.getPostBySlug as Mock).mockResolvedValue(null);
      const res = response();

      await postHandler(request({ slug: 'missing' }), res as unknown as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('answers 502, and logs why, when Sanity cannot be queried', async () => {
      (sanitySource.getPostBySlug as Mock).mockRejectedValue(new Error('Sanity unavailable'));
      const res = response();

      await postHandler(request({ slug: 'hello' }), res as unknown as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(502);
      expect(console.error).toHaveBeenCalledWith('Unable to fetch Sanity post', expect.any(Error));
    });

    it('answers 400 without a slug', async () => {
      const res = response();

      await postHandler(request({}), res as unknown as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(sanitySource.getPostBySlug).not.toHaveBeenCalled();
    });

    // Every source is asked for every slug, so an unconfigured source must not fail the lookup.
    it('answers 404 when Sanity is not configured', async () => {
      (isSanityConfigured as Mock).mockReturnValue(false);
      const res = response();

      await postHandler(request({ slug: 'hello' }), res as unknown as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(sanitySource.getPostBySlug).not.toHaveBeenCalled();
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
  });
});
