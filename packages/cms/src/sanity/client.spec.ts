import type { Mock } from 'vitest';
import { isSanityConfigured, querySanity } from './client';

const ORIGINAL_ENV = process.env;

const jsonResponse = (status: number, body: unknown) => ({ ok: status < 300, status, json: async () => body }) as Response;

beforeEach(() => {
  process.env = {
    ...ORIGINAL_ENV,
    SANITY_PROJECT_ID: '7924v9hl',
    SANITY_API_TOKEN: 'viewer-token',
    SANITY_DATASET: undefined,
    SANITY_API_VERSION: undefined,
  };
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, { result: [{ _id: 'p1' }] })));
});

afterEach(() => vi.unstubAllGlobals());
afterAll(() => {
  process.env = ORIGINAL_ENV;
});

const requestedUrl = () => new URL((fetch as Mock).mock.calls[0][0] as string);
const requestedInit = () => (fetch as Mock).mock.calls[0][1] as RequestInit;

describe('isSanityConfigured', () => {
  it.each([
    [{}, true],
    [{ SANITY_PROJECT_ID: '' }, false],
    [{ SANITY_API_TOKEN: undefined }, false],
  ])('with %o is %s', (env, expected) => {
    process.env = { ...process.env, ...env };

    expect(isSanityConfigured()).toBe(expected);
  });
});

describe('querySanity', () => {
  it('queries the production dataset with the token, for published content only', async () => {
    await expect(querySanity('*[_type == $t]', { t: 'blogPost' })).resolves.toEqual([{ _id: 'p1' }]);

    const url = requestedUrl();
    expect(`${url.origin}${url.pathname}`).toBe('https://7924v9hl.api.sanity.io/v2025-02-19/data/query/production');
    expect(url.searchParams.get('query')).toBe('*[_type == $t]');
    expect(url.searchParams.get('$t')).toBe('"blogPost"');
    expect(url.searchParams.get('perspective')).toBe('published');
    expect(new Headers(requestedInit().headers).get('Authorization')).toBe('Bearer viewer-token');
  });

  it('reads the dataset and API version from the environment', async () => {
    process.env = { ...process.env, SANITY_DATASET: 'staging', SANITY_API_VERSION: '2026-01-01' };

    await querySanity('*', {});

    expect(requestedUrl().pathname).toBe('/v2026-01-01/data/query/staging');
  });

  it('always asks for published content, whatever the params say', async () => {
    await querySanity('*', { perspective: 'drafts' });

    expect(requestedUrl().searchParams.getAll('perspective')).toEqual(['published']);
  });

  it('rejects with the status when Sanity does not answer 2xx', async () => {
    (fetch as Mock).mockResolvedValue(jsonResponse(401, { error: 'Unauthorized' }));

    await expect(querySanity('*', {})).rejects.toThrow('Sanity query failed: 401');
  });
});
