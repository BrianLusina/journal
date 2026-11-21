import { SITE_IDS, normalizeHost, type EnvName, type RegistryConfig, type SiteId } from './registry';

export type Resolution =
  | { kind: 'site'; site: SiteId; env: EnvName | 'preview'; via: 'host' | 'override'; setCookie?: SiteId }
  | { kind: 'redirect'; status: 301; location: string }
  | { kind: 'landing' }
  | { kind: 'not-found' };

export const SITE_COOKIE = 'site';

const isSiteId = (value: string | null | undefined): value is SiteId => SITE_IDS.includes(value as SiteId);

const cookieValue = (cookie: string, name: string) =>
  cookie
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);

/** The site a host serves, and in which environment. The blog's hosts are not served here. */
function siteForHost(host: string, registry: RegistryConfig): { site: SiteId; env: EnvName } | undefined {
  for (const [env, hosts] of Object.entries(registry.environments) as [EnvName, Record<string, string>][]) {
    const site = SITE_IDS.find(id => hosts[id] === host);
    if (site) return { site, env };
  }
  return undefined;
}

/**
 * What to serve for a request. The order matters:
 * 1. redirect hosts (www → apex);
 * 2. the internal route prefixes are never served directly, so each page has one URL;
 * 3. a production hostname always serves its own site: the preview override is refused there even
 *    where VERCEL_ENV is unset (a self-hosted production);
 * 4. another registered host serves its site, unless an override (?site=, then the cookie) applies
 *    outside production;
 * 5. an unregistered host outside production (a preview URL) serves the override, or a landing page;
 * 6. anything else is a 404.
 */
export function resolveRequest(
  input: { host: string; url: URL; cookie: string; vercelEnv?: string },
  registry: RegistryConfig,
): Resolution {
  const host = normalizeHost(input.host);
  const { pathname, search } = input.url;

  const redirectTo = registry.redirects[host];
  if (redirectTo) return { kind: 'redirect', status: 301, location: `https://${redirectTo}${pathname}${search}` };

  if (SITE_IDS.some(id => pathname === `/${id}` || pathname.startsWith(`/${id}/`))) return { kind: 'not-found' };

  const byHost = siteForHost(host, registry);
  const outsideProduction = input.vercelEnv !== 'production' && byHost?.env !== 'production';
  const fromQuery = input.url.searchParams.get(SITE_COOKIE);
  const fromCookie = cookieValue(input.cookie, SITE_COOKIE);
  const override = outsideProduction ? (isSiteId(fromQuery) ? fromQuery : isSiteId(fromCookie) ? fromCookie : undefined) : undefined;
  const setCookie = override && override === fromQuery ? { setCookie: override } : {};

  if (byHost) {
    if (override) return { kind: 'site', site: override, env: byHost.env, via: 'override', ...setCookie };
    return { kind: 'site', site: byHost.site, env: byHost.env, via: 'host' };
  }

  if (input.vercelEnv !== 'production') {
    return override ? { kind: 'site', site: override, env: 'preview', via: 'override', ...setCookie } : { kind: 'landing' };
  }

  return { kind: 'not-found' };
}
