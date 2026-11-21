import type { MiddlewareHandler } from 'astro';
import type { RegistryConfig } from './sites/registry';
import { registry } from './sites/current';
import { resolveRequest, SITE_COOKIE } from './sites/resolve';

const EDGE_CACHE = 's-maxage=300, stale-while-revalidate=86400';
const NO_STORE = 'private, no-store';

/** A copy of the response with extra headers: a rewritten page's headers may be immutable. */
function withHeaders(response: Response, headers: Record<string, string>, status = response.status): Response {
  const copy = new Response(response.body, { status, statusText: response.statusText, headers: new Headers(response.headers) });
  Object.entries(headers).forEach(([name, value]) => copy.headers.set(name, value));
  return copy;
}

/**
 * Serves each request as the site its host (or, outside production, the ?site= override) names,
 * by rewriting to that site's routes under src/pages/<site>/. Hostname-resolved pages may be cached
 * at the edge: the CDN's cache key includes the host. Anything that depends on the override cookie,
 * or on its absence, is never cached, since it would otherwise be served for the wrong site.
 */
export function createSiteMiddleware(registry: RegistryConfig, vercelEnv: () => string | undefined): MiddlewareHandler {
  return async (context, next) => {
    // Astro runs the middleware again for the request it rewrote: that one goes to its page as is.
    if (context.locals.rewritten) return next();
    const rewrite = (path: string) => {
      context.locals.rewritten = true;
      return context.rewrite(path);
    };
    const { request, url } = context;
    const resolution = resolveRequest(
      { host: request.headers.get('host') ?? url.host, url, cookie: request.headers.get('cookie') ?? '', vercelEnv: vercelEnv() },
      registry,
    );

    switch (resolution.kind) {
      case 'redirect':
        return new Response(null, { status: resolution.status, headers: { Location: resolution.location } });
      case 'not-found':
        return withHeaders(await rewrite('/404'), { 'Cache-Control': NO_STORE }, 404);
      case 'landing':
        return withHeaders(await rewrite('/'), { 'Cache-Control': NO_STORE, Vary: 'Cookie', 'X-Robots-Tag': 'noindex' });
      case 'site': {
        const { site, env, via, setCookie } = resolution;
        context.locals.site = { id: site, env, via };
        if (setCookie) context.cookies.set(SITE_COOKIE, setCookie, { path: '/', httpOnly: true, sameSite: 'lax', secure: true });
        const response = await rewrite(`/${site}${url.pathname}${url.search}`);
        return withHeaders(response, {
          'Cache-Control': via === 'override' ? NO_STORE : EDGE_CACHE,
          ...(via === 'override' ? { Vary: 'Cookie' } : {}),
          ...(env === 'production' ? {} : { 'X-Robots-Tag': 'noindex' }),
        });
      }
    }
  };
}

export const onRequest = createSiteMiddleware(registry, () => process.env.VERCEL_ENV);
