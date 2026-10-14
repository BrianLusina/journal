import { parse } from 'graphql';

const ORIGINAL_ENV = process.env;

const jsonResponse = (ok: boolean, body: unknown = {}, status = ok ? 200 : 503) =>
  ({ ok, status, json: async () => body }) as Response;

// The tag list is cached for the module's lifetime, so each test loads a fresh copy.
const loadShared = () => {
  let shared = {} as typeof import('./_shared');
  jest.isolateModules(() => {
    // isolateModules needs a synchronous require to get a fresh module.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    shared = require('./_shared');
  });
  return shared;
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
  ])('with %o is %s', (env, expected) => {
    process.env = { ...process.env, ...env };

    expect(loadShared().isContentfulConfigured()).toBe(expected);
  });
});

describe('GET_BLOG_POSTS', () => {
  it('is a valid GraphQL document', () => {
    expect(() => parse(loadShared().GET_BLOG_POSTS)).not.toThrow();
  });

  it('bounds the author collection so the feed stays under the Contentful query cost limit', () => {
    expect(loadShared().GET_BLOG_POSTS).toContain('authorsCollection(limit: 5)');
  });

  it('fetches what the author badge displays, so authors are not fetched one by one', () => {
    // `authors` links to any Entry (the field has no content type validation), so Contentful types
    // its items as the Entry interface: Person fields are only selectable through `... on Person`.
    const authors = loadShared().GET_BLOG_POSTS.split('authorsCollection(limit: 5)')[1];
    const person = authors.match(/\.\.\. on Person {([^}]*{[^}]*}[^}]*)}/)?.[1] ?? '';
    expect(person).toMatch(/\bname\b/);
    expect(person).toMatch(/\bshortBio\b/);
    expect(person).toMatch(/image\s*{\s*url\s*}/);
  });
});

describe('queryContentful', () => {
  it('posts the query to the space with the delivery token and returns its data', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(true, { data: { blogPostCollection: { total: 0, items: [] } } }));
    const { queryContentful } = loadShared();

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
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(true, { data: {} }));

    await loadShared().queryContentful('query { a }', {});

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe(
      'https://graphql.example/content/v1/spaces/space/environments/staging',
    );
  });

  it('rejects when Contentful answers with an error status', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(false, {}, 429));

    await expect(loadShared().queryContentful('query { a }', {})).rejects.toThrow('Unable to query Contentful: 429');
  });

  it('rejects when the GraphQL response carries errors', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(jsonResponse(true, { data: null, errors: [{ message: 'Query too complex' }] }));

    await expect(loadShared().queryContentful('query { a }', {})).rejects.toThrow('Query too complex');
  });
});

describe('getTagId', () => {
  it('finds the ID of the Contentful tag with the name, fetching the tag list once', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      jsonResponse(true, {
        items: [
          { name: 'Data Structures', sys: { id: 'datastructures' } },
          { name: 'System Design', sys: { id: 'systemDesign' } },
        ],
      }),
    );
    const { getTagId } = loadShared();

    await expect(getTagId('Data Structures')).resolves.toBe('datastructures');
    await expect(getTagId('Browsers')).resolves.toBeUndefined();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('https://cdn.contentful.com/spaces/space/environments/master/tags?limit=1000', {
      headers: { Authorization: 'Bearer token' },
    });
  });

  it('rejects when the tag list cannot be fetched, and fetches it again next time', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse(false))
      .mockResolvedValueOnce(jsonResponse(true, { items: [{ name: 'Travel', sys: { id: 'travel' } }] }));
    const { getTagId } = loadShared();

    await expect(getTagId('Travel')).rejects.toThrow('Unable to fetch Contentful tags: 503');
    await expect(getTagId('Travel')).resolves.toBe('travel');
  });
});
