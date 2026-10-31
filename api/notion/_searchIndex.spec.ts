import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from './search-index';
import { listedFilters } from './_schema';
import { getDataSourceId, isNotionConfigured, notion } from './_shared';

jest.mock('./_shared', () => ({
  getDataSourceId: jest.fn(),
  isNotionConfigured: jest.fn(),
  notion: { dataSources: { query: jest.fn() } },
}));

const response = () => {
  const res = { status: jest.fn(), json: jest.fn(), setHeader: jest.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
};

const request = (method = 'GET') => ({ method, query: {} }) as unknown as VercelRequest;

const pages = (from: number, count: number) => Array.from({ length: count }, (_, index) => ({ id: `n${from + index}` }));

describe('Notion search index route', () => {
  beforeEach(() => {
    (getDataSourceId as jest.Mock).mockResolvedValue('ds-1');
    (isNotionConfigured as jest.Mock).mockReturnValue(true);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('follows the cursor until Notion has no more, listing only published posts with a slug', async () => {
    (notion.dataSources.query as jest.Mock)
      .mockResolvedValueOnce({ results: pages(0, 100), has_more: true, next_cursor: 'c2' })
      .mockResolvedValueOnce({ results: pages(100, 5), has_more: false, next_cursor: null });
    const res = response();

    await handler(request(), res as unknown as VercelResponse);

    expect(notion.dataSources.query).toHaveBeenCalledTimes(2);
    expect(notion.dataSources.query).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ data_source_id: 'ds-1', page_size: 100, start_cursor: undefined, filter: { and: listedFilters } }),
    );
    expect(notion.dataSources.query).toHaveBeenNthCalledWith(2, expect.objectContaining({ start_cursor: 'c2' }));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ results: pages(0, 105) });
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    expect(res.setHeader).toHaveBeenCalledWith('X-Search-Documents', '105');
  });

  it('stops when Notion says it has more but gives no cursor', async () => {
    (notion.dataSources.query as jest.Mock).mockResolvedValueOnce({ results: pages(0, 1), has_more: true, next_cursor: null });
    const res = response();

    await handler(request(), res as unknown as VercelResponse);

    expect(notion.dataSources.query).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ results: pages(0, 1) });
  });

  it('answers 502 without caching when Notion fails', async () => {
    (notion.dataSources.query as jest.Mock).mockRejectedValue(new Error('rate limited'));
    const res = response();

    await handler(request(), res as unknown as VercelResponse);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.setHeader).not.toHaveBeenCalled();
  });

  it('answers 500 when Notion is not configured', async () => {
    (isNotionConfigured as jest.Mock).mockReturnValue(false);
    const res = response();

    await handler(request(), res as unknown as VercelResponse);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('answers 405 to anything but GET', async () => {
    const res = response();

    await handler(request('POST'), res as unknown as VercelResponse);

    expect(res.status).toHaveBeenCalledWith(405);
  });
});
