import type { Mock } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { notionSource, isNotionConfigured } from '@brianlusina/cms/server';
import handler from './search-index';

vi.mock('@brianlusina/cms/server', () => ({
  isNotionConfigured: vi.fn(),
  notionSource: { getSearchIndex: vi.fn() },
}));

const response = () => {
  const res = { status: vi.fn(), json: vi.fn(), setHeader: vi.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
};

const request = (method = 'GET') => ({ method, query: {} }) as unknown as VercelRequest;

const posts = (count: number) =>
  Array.from({ length: count }, (_, index) => ({ id: `p${index}`, source: 'notion', slug: `p${index}` }));

describe('Notion search index route', () => {
  beforeEach(() => {
    (isNotionConfigured as Mock).mockReturnValue(true);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('answers every listed post, cached, with the document count', async () => {
    (notionSource.getSearchIndex as Mock).mockResolvedValue(posts(230));
    const res = response();

    await handler(request(), res as unknown as VercelResponse);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ results: posts(230) });
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    expect(res.setHeader).toHaveBeenCalledWith('X-Search-Documents', '230');
  });

  it('answers 502 without caching when the index cannot be read whole', async () => {
    (notionSource.getSearchIndex as Mock).mockRejectedValue(new Error('Notion reported more posts without a cursor'));
    const res = response();

    await handler(request(), res as unknown as VercelResponse);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.setHeader).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('Unable to fetch the Notion search index', expect.any(Error));
  });

  it('answers 500 when Notion is not configured', async () => {
    (isNotionConfigured as Mock).mockReturnValue(false);
    const res = response();

    await handler(request(), res as unknown as VercelResponse);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(notionSource.getSearchIndex).not.toHaveBeenCalled();
  });

  it('answers 405 to anything but GET', async () => {
    const res = response();

    await handler(request('POST'), res as unknown as VercelResponse);

    expect(res.status).toHaveBeenCalledWith(405);
  });
});
