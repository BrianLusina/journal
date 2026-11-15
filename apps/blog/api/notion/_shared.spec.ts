import type { Mock } from 'vitest';
import { APIErrorCode, APIResponseError } from '@notionhq/client';

const mockRetrieve = vi.fn();

vi.mock('@notionhq/client', async () => {
  const actual = await vi.importActual<object>('@notionhq/client');
  return { ...actual, Client: vi.fn() };
});

const loadShared = async (env: Record<string, string | undefined>) => {
  process.env = { ...ORIGINAL_ENV, NOTION_API_KEY: 'secret', ...env };
  // A fresh module registry, so _shared reads the env at module load.
  vi.resetModules();
  const { Client } = await import('@notionhq/client');
  // Set per load because the config's mockReset clears implementations between tests.
  (Client as unknown as Mock).mockImplementation(() => ({ databases: { retrieve: mockRetrieve } }));
  return import('./_shared');
};

const ORIGINAL_ENV = process.env;

const notFound = () =>
  new APIResponseError({
    code: APIErrorCode.ObjectNotFound,
    status: 404,
    message: 'Could not find database',
    headers: {},
    rawBodyText: '',
  });

describe('getDataSourceId', () => {
  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('uses NOTION_DATA_SOURCE_ID directly when it is set', async () => {
    const { getDataSourceId } = await loadShared({ NOTION_DATA_SOURCE_ID: 'ds-1', NOTION_DATABASE_ID: 'db-1' });

    await expect(getDataSourceId()).resolves.toBe('ds-1');
    expect(mockRetrieve).not.toHaveBeenCalled();
  });

  it("resolves the database's first data source from NOTION_DATABASE_ID once", async () => {
    mockRetrieve.mockResolvedValue({ object: 'database', id: 'db-1', title: [], data_sources: [{ id: 'ds-from-db', name: 'Posts' }] });
    const { getDataSourceId } = await loadShared({ NOTION_DATABASE_ID: 'db-1' });

    await expect(getDataSourceId()).resolves.toBe('ds-from-db');
    await expect(getDataSourceId()).resolves.toBe('ds-from-db');
    expect(mockRetrieve).toHaveBeenCalledTimes(1);
    expect(mockRetrieve).toHaveBeenCalledWith({ database_id: 'db-1' });
  });

  it('treats NOTION_DATABASE_ID as a data source ID when Notion says it is not a database', async () => {
    mockRetrieve.mockRejectedValue(notFound());
    const { getDataSourceId } = await loadShared({ NOTION_DATABASE_ID: 'actually-a-data-source' });

    await expect(getDataSourceId()).resolves.toBe('actually-a-data-source');
  });

  it('fails when the database has no data sources', async () => {
    mockRetrieve.mockResolvedValue({ object: 'database', id: 'db-1', title: [], data_sources: [] });
    const { getDataSourceId } = await loadShared({ NOTION_DATABASE_ID: 'db-1' });

    await expect(getDataSourceId()).rejects.toThrow('has no data sources');
  });

  it('retries resolution after a transient failure instead of caching it', async () => {
    mockRetrieve
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({ object: 'database', id: 'db-1', title: [], data_sources: [{ id: 'ds-1', name: 'Posts' }] });
    const { getDataSourceId } = await loadShared({ NOTION_DATABASE_ID: 'db-1' });

    await expect(getDataSourceId()).rejects.toThrow('network down');
    await expect(getDataSourceId()).resolves.toBe('ds-1');
  });
});

describe('isNotionConfigured', () => {
  it.each([
    [{ NOTION_DATA_SOURCE_ID: 'ds-1' }, true],
    [{ NOTION_DATABASE_ID: 'db-1' }, true],
    [{}, false],
    [{ NOTION_DATABASE_ID: 'db-1', NOTION_API_KEY: '' }, false],
  ])('with %o is %s', async (env, expected) => {
    expect((await loadShared(env)).isNotionConfigured()).toBe(expected);
  });
});
