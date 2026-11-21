import { canonicalUrl } from '../sites/urls';
import type { RegistryConfig, SiteId } from '../sites/registry';
import { ROUTES } from '../sites/routes';

/** The site's pages, by the URLs search engines should know them by (the production host). */
export function sitemapXml(site: SiteId, registry: RegistryConfig): string {
  const urls = ROUTES[site].map(path => `  <url><loc>${canonicalUrl(site, path, registry)}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
