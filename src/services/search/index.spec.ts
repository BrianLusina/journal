import type { Mock } from 'vitest';
import { loadSearchIndex } from './searchIndex';
import { loadSearchEngine, resetSearchEngine, SEARCH_ENGINE_TTL_MS } from '.';

vi.mock('@monitoring', () => ({ addBreadcrumb: vi.fn(), captureException: vi.fn() }));
vi.mock('@cmsService', () => ({ cmsAdapters: [] }));
vi.mock('./searchIndex', () => ({ loadSearchIndex: vi.fn() }));

const complete = { documents: [], errors: [] };

describe('loadSearchEngine', () => {
  beforeEach(() => {
    resetSearchEngine();
    vi.spyOn(Date, 'now').mockReturnValue(0);
  });

  it('loads the index once and shares the engine', async () => {
    (loadSearchIndex as Mock).mockResolvedValue(complete);

    const first = await loadSearchEngine();
    const second = await loadSearchEngine();

    expect(second).toBe(first);
    expect(loadSearchIndex).toHaveBeenCalledTimes(1);
  });

  it('loads the index again once the engine is older than its time to live', async () => {
    (loadSearchIndex as Mock).mockResolvedValue(complete);
    await loadSearchEngine();

    (Date.now as Mock).mockReturnValue(SEARCH_ENGINE_TTL_MS + 1);
    await loadSearchEngine();

    expect(loadSearchIndex).toHaveBeenCalledTimes(2);
  });

  it('uses an engine missing a failed source, but loads again on the next call', async () => {
    (loadSearchIndex as Mock).mockResolvedValueOnce({ documents: [], errors: [new Error('notion down')] });
    (loadSearchIndex as Mock).mockResolvedValue(complete);

    await expect(loadSearchEngine()).resolves.toBeDefined();
    await loadSearchEngine();
    await loadSearchEngine();

    expect(loadSearchIndex).toHaveBeenCalledTimes(2);
  });

  it('loads again after a failed load', async () => {
    (loadSearchIndex as Mock).mockRejectedValueOnce(new Error('offline'));
    (loadSearchIndex as Mock).mockResolvedValue(complete);

    await expect(loadSearchEngine()).rejects.toThrow('offline');
    await expect(loadSearchEngine()).resolves.toBeDefined();
  });
});
