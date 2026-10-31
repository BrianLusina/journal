import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from './search-index';
import { isContentfulConfigured, queryContentful } from './_shared';

jest.mock('./_shared', () => ({
  GET_SEARCH_INDEX: 'GET_SEARCH_INDEX',
  isContentfulConfigured: jest.fn(),
  queryContentful: jest.fn(),
}));

const response = () => {
  const res = { status: jest.fn(), json: jest.fn(), setHeader: jest.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
};

const request = (method = 'GET') => ({ method, query: {} }) as unknown as VercelRequest;

const posts = (from: number, count: number) =>
  Array.from({ length: count }, (_, index) => ({ sys: { id: `p${from + index}` } }));

describe('Contentful search index route', () => {
  beforeEach(() => {
    (isContentfulConfigured as jest.Mock).mockReturnValue(true);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('reads every dated post, a page of 100 at a time, past the first page', async () => {
    (queryContentful as jest.Mock)
      .mockResolvedValueOnce({ blogPostCollection: { total: 230, items: posts(0, 100) } })
      .mockResolvedValueOnce({ blogPostCollection: { total: 230, items: posts(100, 100) } })
      .mockResolvedValueOnce({ blogPostCollection: { total: 230, items: posts(200, 30) } });
    const res = response();

    await handler(request(), res as unknown as VercelResponse);

    expect(queryContentful).toHaveBeenCalledTimes(3);
    [0, 100, 200].forEach((skip, call) =>
      expect(queryContentful).toHaveBeenNthCalledWith(call + 1, 'GET_SEARCH_INDEX', {
        skip,
        limit: 100,
        order: ['publishDate_DESC'],
        where: { publishDate_exists: true },
      }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ results: posts(0, 230) });
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    expect(res.setHeader).toHaveBeenCalledWith('X-Search-Documents', '230');
  });

  it('stops at an empty page even when the total says more remain', async () => {
    (queryContentful as jest.Mock)
      .mockResolvedValueOnce({ blogPostCollection: { total: 150, items: posts(0, 100) } })
      .mockResolvedValueOnce({ blogPostCollection: { total: 150, items: [] } });
    const res = response();

    await handler(request(), res as unknown as VercelResponse);

    expect(queryContentful).toHaveBeenCalledTimes(2);
    expect(res.json).toHaveBeenCalledWith({ results: posts(0, 100) });
  });

  it('answers 502 without caching when Contentful fails', async () => {
    (queryContentful as jest.Mock).mockRejectedValue(new Error('Unable to query Contentful: 503'));
    const res = response();

    await handler(request(), res as unknown as VercelResponse);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.setHeader).not.toHaveBeenCalled();
  });

  it('answers 500 when Contentful is not configured', async () => {
    (isContentfulConfigured as jest.Mock).mockReturnValue(false);
    const res = response();

    await handler(request(), res as unknown as VercelResponse);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(queryContentful).not.toHaveBeenCalled();
  });

  it('answers 405 to anything but GET', async () => {
    const res = response();

    await handler(request('POST'), res as unknown as VercelResponse);

    expect(res.status).toHaveBeenCalledWith(405);
  });
});
