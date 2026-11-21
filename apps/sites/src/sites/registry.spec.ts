import { loadRegistry, normalizeHost } from './registry';

describe('normalizeHost', () => {
  it.each([
    ['BrianLusina.com', 'brianlusina.com'],
    ['brianlusina.com:443', 'brianlusina.com'],
    ['brianlusina.com:80', 'brianlusina.com'],
    ['brianlusina.com.', 'brianlusina.com'],
    ['folio.localhost:4321', 'folio.localhost:4321'],
  ])('reads %s as %s', (host, expected) => {
    expect(normalizeHost(host)).toBe(expected);
  });
});

describe('loadRegistry', () => {
  it('reads sites.config.json by default', () => {
    expect(loadRegistry({}).environments.production.folio).toBe('folio.brianlusina.com');
  });

  it('takes the whole registry from SITES_CONFIG, for hosts the file does not know', () => {
    const config = {
      environments: {
        production: { home: 'example.org', folio: 'folio.example.org', blog: 'blog.example.org' },
        staging: { home: 's.example.org', folio: 's.folio.example.org', blog: 's.blog.example.org' },
        development: { home: 'localhost:4321', folio: 'folio.localhost:4321', blog: 'localhost:8080' },
      },
      redirects: {},
    };

    expect(loadRegistry({ SITES_CONFIG: JSON.stringify(config) })).toEqual(config);
  });

  it.each([
    ['malformed JSON', '{'],
    ['a missing environment', '{"environments":{"production":{"home":"a","folio":"b","blog":"c"}},"redirects":{}}'],
    [
      'a missing site',
      '{"environments":{"production":{"home":"a","blog":"c"},"staging":{"home":"a","folio":"b","blog":"c"},"development":{"home":"a","folio":"b","blog":"c"}},"redirects":{}}',
    ],
  ])('rejects SITES_CONFIG with %s', (_, value) => {
    expect(() => loadRegistry({ SITES_CONFIG: value })).toThrow('Invalid SITES_CONFIG');
  });
});
