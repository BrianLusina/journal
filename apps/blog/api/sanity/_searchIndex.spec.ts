import type { Mock } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sanitySource, isSanityConfigured } from '@brianlusina/cms/server';
import handler from './search-index';

vi.mock('@brianlusina/cms/server', () => ({
  isSanityConfigured: vi.fn(),
  sanitySource: { getSearchIndex: vi.fn() },
}));

const response = () => {
  const res = { status: vi.fn(), json: vi.fn(), setHeader: vi.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
};

const request = (method = 'GET') => ({ method, query: {} }) as unknown as VercelRequest;

const posts = (count: number) =>
  Array.from({ length: count }, (_, index) => ({ id: `p${index}`, source: 'sanity', slug: `p${index}` }));

describe('Sanity search index route', () => {
  beforeEach(() => {
    (isSanityConfigured as Mock).mockReturnValue(true);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('answers every listed post, cached, with the document count', async () => {
    (sanitySource.getSearchIndex as Mock).mockResolvedValue(posts(230));
    const res = response();

    await handler(request(), res as unknown as VercelResponse);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ results: posts(230) });
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    expect(res.setHeader).toHaveBeenCalledWith('X-Search-Documents', '230');
  });

  it('answers 502 without caching when the index cannot be read whole', async () => {
    (sanitySource.getSearchIndex as Mock).mockRejectedValue(new Error('Sanity reported more posts without a cursor'));
    const res = response();

    await handler(request(), res as unknown as VercelResponse);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.setHeader).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('Unable to fetch the Sanity search index', expect.any(Error));
  });

  it('answers 500 when Sanity is not configured', async () => {
    (isSanityConfigured as Mock).mockReturnValue(false);
    const res = response();

    await handler(request(), res as unknown as VercelResponse);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(sanitySource.getSearchIndex).not.toHaveBeenCalled();
  });

  it('answers 405 to anything but GET', async () => {
    const res = response();

    await handler(request('POST'), res as unknown as VercelResponse);

    expect(res.status).toHaveBeenCalledWith(405);
  });
});
