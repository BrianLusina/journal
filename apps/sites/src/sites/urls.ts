import type { EnvName, LinkTarget, RegistryConfig, SiteId } from './registry';
import { SITE_COOKIE } from './resolve';

/**
 * A link to another site, or to the blog, in the environment this page is served in: staging links
 * to staging. A preview has one URL for every site, so it switches site with ?site= and links the
 * blog on staging.
 */
export function siteUrl(
  target: LinkTarget,
  path: string,
  from: { env: EnvName | 'preview'; origin: string },
  registry: RegistryConfig,
): string {
  if (from.env === 'preview') {
    if (target === 'blog') return `https://${registry.environments.staging.blog}${path}`;
    const url = new URL(path, from.origin);
    url.searchParams.set(SITE_COOKIE, target);
    return url.toString();
  }
  const protocol = from.env === 'development' ? 'http' : 'https';
  return `${protocol}://${registry.environments[from.env][target]}${path}`;
}

/** The one URL search engines should know a page by: always the production host. */
export function canonicalUrl(site: SiteId, path: string, registry: RegistryConfig): string {
  return `https://${registry.environments.production[site]}${path}`;
}
