import { canonicalUrl } from '../sites/urls';
import type { RegistryConfig, SiteId } from '../sites/registry';

/** Production sites are open to crawlers; previews, staging and local servers are closed. */
export function robotsTxt(site: SiteId, isProduction: boolean, registry: RegistryConfig): string {
  if (!isProduction) return 'User-agent: *\nDisallow: /\n';
  return `User-agent: *\nAllow: /\nSitemap: ${canonicalUrl(site, '/sitemap.xml', registry)}\n`;
}
