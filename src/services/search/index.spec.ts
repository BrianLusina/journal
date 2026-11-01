import { loadSearchIndex } from './searchIndex';
import { loadSearchEngine, resetSearchEngine, SEARCH_ENGINE_TTL_MS } from '.';

jest.mock('@monitoring', () => ({ addBreadcrumb: jest.fn(), captureException: jest.fn() }));
jest.mock('@cmsService', () => ({ cmsAdapters: [] }));
jest.mock('./searchIndex', () => ({ loadSearchIndex: jest.fn() }));

const complete = { documents: [], errors: [] };

describe('loadSearchEngine', () => {
  beforeEach(() => {
    resetSearchEngine();
    jest.spyOn(Date, 'now').mockReturnValue(0);
  });

  it('loads the index once and shares the engine', async () => {
    (loadSearchIndex as jest.Mock).mockResolvedValue(complete);

    const first = await loadSearchEngine();
    const second = await loadSearchEngine();

    expect(second).toBe(first);
    expect(loadSearchIndex).toHaveBeenCalledTimes(1);
  });

  it('loads the index again once the engine is older than its time to live', async () => {
    (loadSearchIndex as jest.Mock).mockResolvedValue(complete);
    await loadSearchEngine();

    (Date.now as jest.Mock).mockReturnValue(SEARCH_ENGINE_TTL_MS + 1);
    await loadSearchEngine();

    expect(loadSearchIndex).toHaveBeenCalledTimes(2);
  });

  it('uses an engine missing a failed source, but loads again on the next call', async () => {
    (loadSearchIndex as jest.Mock).mockResolvedValueOnce({ documents: [], errors: [new Error('notion down')] });
    (loadSearchIndex as jest.Mock).mockResolvedValue(complete);

    await expect(loadSearchEngine()).resolves.toBeDefined();
    await loadSearchEngine();
    await loadSearchEngine();

    expect(loadSearchIndex).toHaveBeenCalledTimes(2);
  });

  it('loads again after a failed load', async () => {
    (loadSearchIndex as jest.Mock).mockRejectedValueOnce(new Error('offline'));
    (loadSearchIndex as jest.Mock).mockResolvedValue(complete);

    await expect(loadSearchEngine()).rejects.toThrow('offline');
    await expect(loadSearchEngine()).resolves.toBeDefined();
  });
});
