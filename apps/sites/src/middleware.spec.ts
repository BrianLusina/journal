import { loadRegistry } from './sites/registry';
import { createSiteMiddleware } from './middleware';

const registry = loadRegistry({});

const call = async (url: string, { cookie = '', vercelEnv = 'production' }: { cookie?: string; vercelEnv?: string } = {}) => {
  const request = new Request(url, { headers: cookie ? { cookie } : {} });
  const rewrites: string[] = [];
  const cookiesSet: [string, string, Record<string, unknown>][] = [];
  const context = {
    request,
    url: new URL(url),
    locals: {} as Record<string, unknown>,
    cookies: { set: (name: string, value: string, options: Record<string, unknown>) => cookiesSet.push([name, value, options]) },
    rewrite: async (path: string) => {
      rewrites.push(path);
      return new Response(`page ${path}`, { status: 200, headers: { 'Content-Type': 'text/html' } });
    },
  };
  const response = await createSiteMiddleware(registry, () => vercelEnv)(context as never, async () => new Response('next'));
  return { response: response as Response, rewrites, cookiesSet, locals: context.locals };
};

// Astro runs the middleware again for a rewritten request, with the same locals.
const callLikeAstro = async (url: string, vercelEnv = 'production') => {
  const middleware = createSiteMiddleware(registry, () => vercelEnv);
  const locals: Record<string, unknown> = {};
  const served: string[] = [];
  const contextFor = (target: string): unknown => ({
    request: new Request(target),
    url: new URL(target),
    locals,
    cookies: { set: () => undefined },
    rewrite: async (path: string) =>
      middleware(contextFor(new URL(path, target).toString()) as never, async () => {
        served.push(path);
        return new Response(`page ${path}`);
      }) as Promise<Response>,
  });
  const response = (await middleware(contextFor(url) as never, async () => new Response('next'))) as Response;
  return { response, served };
};

describe('the sites middleware', () => {
  it('lets the request it rewrote reach its page, instead of resolving it again', async () => {
    const { response, served } = await callLikeAstro('https://folio.brianlusina.com/');

    expect(served).toEqual(['/folio/']);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('page /folio/');
  });

  it('serves a site by hostname through its route prefix, cached at the edge', async () => {
    const { response, rewrites, locals } = await call('https://folio.brianlusina.com/p?x=1');

    expect(rewrites).toEqual(['/folio/p?x=1']);
    expect(locals.site).toEqual({ id: 'folio', env: 'production', via: 'host' });
    expect(response.headers.get('Cache-Control')).toBe('s-maxage=300, stale-while-revalidate=86400');
    expect(response.headers.get('X-Robots-Tag')).toBeNull();
  });

  it('serves the override, remembers it in a cookie, and keeps the answer out of every cache', async () => {
    const { response, rewrites, cookiesSet } = await call('https://journal-x.vercel.app/?site=folio', { vercelEnv: 'preview' });

    expect(rewrites).toEqual(['/folio/?site=folio']);
    expect(cookiesSet).toEqual([['site', 'folio', { path: '/', httpOnly: true, sameSite: 'lax', secure: true }]]);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(response.headers.get('Vary')).toBe('Cookie');
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex');
  });

  it('shows the landing page on a preview without an override, uncached', async () => {
    const { response, rewrites } = await call('https://journal-x.vercel.app/', { vercelEnv: 'preview' });

    expect(rewrites).toEqual(['/']);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(response.headers.get('Vary')).toBe('Cookie');
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex');
  });

  it('answers an unknown host with the 404 page and a 404 status', async () => {
    const { response, rewrites } = await call('https://evil.example/');

    expect(rewrites).toEqual(['/404']);
    expect(response.status).toBe(404);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  });

  it('redirects www to the apex', async () => {
    const { response } = await call('https://www.brianlusina.com/a');

    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe('https://brianlusina.com/a');
  });

  it('keeps staging out of search engines', async () => {
    const { response } = await call('https://staging.brianlusina.com/', { vercelEnv: 'preview' });

    expect(response.headers.get('X-Robots-Tag')).toBe('noindex');
  });
});
