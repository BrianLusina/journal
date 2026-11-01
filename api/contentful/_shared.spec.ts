import type { Mock } from 'vitest';
import { parse } from 'graphql';

const ORIGINAL_ENV = process.env;

const jsonResponse = (ok: boolean, body: unknown = {}, status = ok ? 200 : 503) =>
  ({ ok, status, json: async () => body }) as Response;

// The tag list is cached for the module's lifetime, so each test loads a fresh copy.
const loadShared = () => {
  vi.resetModules();
  return import('./_shared');
};

beforeEach(() => {
  process.env = {
    ...ORIGINAL_ENV,
    CONTENTFUL_CMS_API_KEY: 'token',
    CONTENTFUL_CMS_SPACE_ID: 'space',
    CONTENTFUL_CMS_ENVIRONMENT: undefined,
    CONTENTFUL_CMS_GRAPHQL_URL: undefined,
    CONTENTFUL_CMS_REST_API_URL: undefined,
  };
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe('isContentfulConfigured', () => {
  it.each([
    [{}, true],
    [{ CONTENTFUL_CMS_API_KEY: '' }, false],
    [{ CONTENTFUL_CMS_SPACE_ID: undefined }, false],
  ])('with %o is %s', async (env, expected) => {
    process.env = { ...process.env, ...env };

    expect((await loadShared()).isContentfulConfigured()).toBe(expected);
  });
});

describe('GET_BLOG_POSTS', () => {
  it('is a valid GraphQL document', async () => {
    const { GET_BLOG_POSTS } = await loadShared();

    expect(() => parse(GET_BLOG_POSTS)).not.toThrow();
  });

  it('bounds the author collection so the feed stays under the Contentful query cost limit', async () => {
    expect((await loadShared()).GET_BLOG_POSTS).toContain('authorsCollection(limit: 5)');
  });

  it('fetches what the author badge displays, so authors are not fetched one by one', async () => {
    // `authors` links to any Entry (the field has no content type validation), so Contentful types
    // its items as the Entry interface: Person fields are only selectable through `... on Person`.
    const authors = (await loadShared()).GET_BLOG_POSTS.split('authorsCollection(limit: 5)')[1];
    const person = authors.match(/\.\.\. on Person {([^}]*{[^}]*}[^}]*)}/)?.[1] ?? '';
    expect(person).toMatch(/\bname\b/);
    expect(person).toMatch(/\bshortBio\b/);
    expect(person).toMatch(/image\s*{\s*url\s*}/);
  });
});

describe('queryContentful', () => {
  it('posts the query to the space with the delivery token and returns its data', async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse(true, { data: { blogPostCollection: { total: 0, items: [] } } }));
    const { queryContentful } = await loadShared();

    await expect(queryContentful('query { a }', { limit: 1 })).resolves.toEqual({
      blogPostCollection: { total: 0, items: [] },
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://graphql.contentful.com/content/v1/spaces/space/environments/master',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
        body: JSON.stringify({ query: 'query { a }', variables: { limit: 1 } }),
      },
    );
  });

  it('uses the configured environment and GraphQL URL', async () => {
    process.env.CONTENTFUL_CMS_ENVIRONMENT = 'staging';
    process.env.CONTENTFUL_CMS_GRAPHQL_URL = 'https://graphql.example';
    global.fetch = vi.fn().mockResolvedValue(jsonResponse(true, { data: {} }));

    await (await loadShared()).queryContentful('query { a }', {});

    expect((global.fetch as Mock).mock.calls[0][0]).toBe(
      'https://graphql.example/content/v1/spaces/space/environments/staging',
    );
  });

  it('rejects when Contentful answers with an error status', async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse(false, {}, 429));

    await expect((await loadShared()).queryContentful('query { a }', {})).rejects.toThrow('Unable to query Contentful: 429');
  });

  it('rejects, saying so, when the response has neither data nor errors', async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse(true, {}));

    await expect((await loadShared()).queryContentful('query { a }', {})).rejects.toThrow('Contentful query failed: no data');
  });

  it('rejects when the GraphQL response carries errors', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(jsonResponse(true, { data: null, errors: [{ message: 'Query too complex' }] }));

    await expect((await loadShared()).queryContentful('query { a }', {})).rejects.toThrow('Query too complex');
  });
});

describe('getTagId', () => {
  it('finds the ID of the Contentful tag with the name, fetching the tag list once', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      jsonResponse(true, {
        items: [
          { name: 'Data Structures', sys: { id: 'datastructures' } },
          { name: 'System Design', sys: { id: 'systemDesign' } },
        ],
      }),
    );
    const { getTagId } = await loadShared();

    await expect(getTagId('Data Structures')).resolves.toBe('datastructures');
    await expect(getTagId('Browsers')).resolves.toBeUndefined();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('https://cdn.contentful.com/spaces/space/environments/master/tags?limit=1000', {
      headers: { Authorization: 'Bearer token' },
    });
  });

  it('reads the tag list again once it is a few minutes old, so a new tag is found', async () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(true, { items: [] }))
      .mockResolvedValueOnce(jsonResponse(true, { items: [{ name: 'Travel', sys: { id: 'travel' } }] }));
    const { getTagId } = await loadShared();

    await expect(getTagId('Travel')).resolves.toBeUndefined();
    now.mockReturnValue(1_000_000 + 4 * 60 * 1000);
    await expect(getTagId('Travel')).resolves.toBeUndefined();
    expect(global.fetch).toHaveBeenCalledTimes(1);

    now.mockReturnValue(1_000_000 + 6 * 60 * 1000);
    await expect(getTagId('Travel')).resolves.toBe('travel');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('rejects when the tag list cannot be fetched, and fetches it again next time', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(false))
      .mockResolvedValueOnce(jsonResponse(true, { items: [{ name: 'Travel', sys: { id: 'travel' } }] }));
    const { getTagId } = await loadShared();

    await expect(getTagId('Travel')).rejects.toThrow('Unable to fetch Contentful tags: 503');
    await expect(getTagId('Travel')).resolves.toBe('travel');
  });
});
