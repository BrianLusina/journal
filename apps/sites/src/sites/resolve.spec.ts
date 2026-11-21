import { loadRegistry } from './registry';
import { resolveRequest } from './resolve';

const registry = loadRegistry({});
const resolve = (url: string, { host, cookie = '', vercelEnv }: { host?: string; cookie?: string; vercelEnv?: string } = {}) => {
  const parsed = new URL(url);
  return resolveRequest({ host: host ?? parsed.host, url: parsed, cookie, vercelEnv }, registry);
};

describe('resolveRequest by hostname', () => {
  it('serves home on the apex', () => {
    expect(resolve('https://brianlusina.com/', { vercelEnv: 'production' })).toEqual({
      kind: 'site',
      site: 'home',
      env: 'production',
      via: 'host',
    });
  });

  it('serves folio on staging', () => {
    expect(resolve('https://staging.folio.brianlusina.com/x', { vercelEnv: 'preview' })).toMatchObject({
      kind: 'site',
      site: 'folio',
      env: 'staging',
      via: 'host',
    });
  });

  it('serves folio on folio.localhost, port included', () => {
    expect(resolve('http://folio.localhost:4321/')).toMatchObject({ site: 'folio', env: 'development' });
  });

  it('answers 404 to a host it does not know, in production', () => {
    expect(resolve('https://evil.example/', { vercelEnv: 'production' })).toEqual({ kind: 'not-found' });
  });

  it('redirects www to the apex, keeping the path and query', () => {
    expect(resolve('https://www.brianlusina.com/a?b=1', { vercelEnv: 'production' })).toEqual({
      kind: 'redirect',
      status: 301,
      location: 'https://brianlusina.com/a?b=1',
    });
  });

  it('resolves host header variants', () => {
    expect(resolve('https://brianlusina.com/', { host: 'BrianLusina.com.:443' })).toMatchObject({ site: 'home' });
  });
});

describe('resolveRequest with the preview override', () => {
  const preview = 'https://journal-x.vercel.app';

  it('honours ?site= on a preview and asks for the cookie', () => {
    expect(resolve(`${preview}/?site=folio`, { vercelEnv: 'preview' })).toEqual({
      kind: 'site',
      site: 'folio',
      env: 'preview',
      via: 'override',
      setCookie: 'folio',
    });
  });

  it('keeps the site from the cookie on later requests', () => {
    expect(resolve(`${preview}/`, { vercelEnv: 'preview', cookie: 'a=1; site=folio' })).toEqual({
      kind: 'site',
      site: 'folio',
      env: 'preview',
      via: 'override',
    });
  });

  it('shows the landing page on a preview with no override', () => {
    expect(resolve(`${preview}/`, { vercelEnv: 'preview' })).toEqual({ kind: 'landing' });
  });

  it('ignores an unknown site id', () => {
    expect(resolve(`${preview}/?site=nope`, { vercelEnv: 'preview' })).toEqual({ kind: 'landing' });
  });

  it('ignores the override on a production hostname even where VERCEL_ENV is unset (Docker)', () => {
    expect(resolve('https://brianlusina.com/?site=folio', { cookie: 'site=folio' })).toEqual({
      kind: 'site',
      site: 'home',
      env: 'production',
      via: 'host',
    });
  });

  it('answers 404 to an unregistered host in production, cookie or not', () => {
    expect(resolve(`${preview}/`, { vercelEnv: 'production', cookie: 'site=folio' })).toEqual({ kind: 'not-found' });
  });

  it('ignores the override on a registered host when VERCEL_ENV is production', () => {
    expect(resolve('https://staging.brianlusina.com/?site=folio', { vercelEnv: 'production' })).toMatchObject({
      site: 'home',
      via: 'host',
    });
  });

  it('honours the override on staging, which is outside production', () => {
    expect(resolve('https://staging.brianlusina.com/?site=folio', { vercelEnv: 'preview' })).toMatchObject({
      site: 'folio',
      env: 'staging',
      via: 'override',
      setCookie: 'folio',
    });
  });
});

describe('resolveRequest for internal prefixes', () => {
  it.each(['/folio/', '/folio', '/home', '/home/x'])('answers 404 to %s, so each page has one URL', path => {
    expect(resolve(`https://brianlusina.com${path}`, { vercelEnv: 'production' })).toEqual({ kind: 'not-found' });
  });

  it('does not mistake a path that only starts with the same letters', () => {
    expect(resolve('https://brianlusina.com/homepage', { vercelEnv: 'production' })).toMatchObject({ kind: 'site' });
  });
});
