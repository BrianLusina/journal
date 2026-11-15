import type { Mock } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { contentfulSource, isContentfulConfigured } from '@brianlusina/cms/server';
import postsHandler from './posts';
import postHandler from './posts/[slug]';

vi.mock('@brianlusina/cms/server', () => ({
  isContentfulConfigured: vi.fn(),
  contentfulSource: { getPosts: vi.fn(), getPostBySlug: vi.fn() },
}));

const CACHE = 's-maxage=60, stale-while-revalidate=300';

const response = () => {
  const res = { status: vi.fn(), json: vi.fn(), setHeader: vi.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
};

const request = (query: Record<string, string>, method = 'GET') => ({ method, query }) as unknown as VercelRequest;

const post = (id: string) => ({ id, source: 'contentful', title: id, slug: id, publishDate: '2024-01-01', tags: [], authors: [] });

describe('Contentful API routes', () => {
  beforeEach(() => {
    (isContentfulConfigured as Mock).mockReturnValue(true);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  describe('posts', () => {
    it('answers a page of unified posts with its cursor, cached at the edge', async () => {
      (contentfulSource.getPosts as Mock).mockResolvedValue({ items: [post('p1')], nextCursor: '1' });
      const res = response();

      await postsHandler(request({ limit: '10', cursor: '0', category: 'Wellness', tag: 'Kotlin' }), res as unknown as VercelResponse);

      expect(contentfulSource.getPosts).toHaveBeenCalledWith({ limit: 10, cursor: '0', category: 'Wellness', tag: 'Kotlin' });
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', CACHE);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ results: [post('p1')], nextCursor: '1' });
    });

    it('passes no cursor, category or tag the request does not have', async () => {
      (contentfulSource.getPosts as Mock).mockResolvedValue({ items: [], nextCursor: null });

      await postsHandler(request({}), response() as unknown as VercelResponse);

      expect(contentfulSource.getPosts).toHaveBeenCalledWith({ limit: 100 });
    });

    it.each(['abc', '-1', '1.5', '1e2', '0x10', ' '])('answers 400 for the cursor %p', async cursor => {
      const res = response();

      await postsHandler(request({ cursor }), res as unknown as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(contentfulSource.getPosts).not.toHaveBeenCalled();
    });

    it('keeps a partial answer out of the edge cache', async () => {
      (contentfulSource.getPosts as Mock).mockResolvedValue({ items: [post('p1')], nextCursor: null, partial: true });
      const res = response();

      await postsHandler(request({ tag: 'Kotlin' }), res as unknown as VercelResponse);

      expect(res.setHeader).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ results: [post('p1')], nextCursor: null });
    });

    it('answers 502 when Contentful cannot be queried', async () => {
      (contentfulSource.getPosts as Mock).mockRejectedValue(new Error('Unable to query Contentful: 429'));
      const res = response();

      await postsHandler(request({}), res as unknown as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.setHeader).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Unable to fetch Contentful posts', expect.any(Error));
    });
  });

  describe('post by slug', () => {
    it('answers the unified post, cached at the edge', async () => {
      (contentfulSource.getPostBySlug as Mock).mockResolvedValue(post('hello'));
      const res = response();

      await postHandler(request({ slug: 'hello' }), res as unknown as VercelResponse);

      expect(contentfulSource.getPostBySlug).toHaveBeenCalledWith('hello');
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', CACHE);
      expect(res.json).toHaveBeenCalledWith({ post: post('hello') });
    });

    it('answers 404 when no post has the slug', async () => {
      (contentfulSource.getPostBySlug as Mock).mockResolvedValue(null);
      const res = response();

      await postHandler(request({ slug: 'missing' }), res as unknown as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('answers 400 without a slug', async () => {
      const res = response();

      await postHandler(request({}), res as unknown as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(contentfulSource.getPostBySlug).not.toHaveBeenCalled();
    });

    it('answers 502 when Contentful cannot be queried', async () => {
      (contentfulSource.getPostBySlug as Mock).mockRejectedValue(new Error('Unable to query Contentful: 429'));
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
    expect(contentfulSource.getPosts).not.toHaveBeenCalled();
    expect(contentfulSource.getPostBySlug).not.toHaveBeenCalled();
  });

  it('answers 500 from the list route when Contentful is not configured', async () => {
    (isContentfulConfigured as Mock).mockReturnValue(false);
    const res = response();

    await postsHandler(request({}), res as unknown as VercelResponse);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(contentfulSource.getPosts).not.toHaveBeenCalled();
  });

  // Every source is asked for every slug, so an unconfigured source must not fail the lookup.
  it('answers 404 from the slug route when Contentful is not configured', async () => {
    (isContentfulConfigured as Mock).mockReturnValue(false);
    const res = response();

    await postHandler(request({ slug: 'hello' }), res as unknown as VercelResponse);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(contentfulSource.getPostBySlug).not.toHaveBeenCalled();
  });
});
