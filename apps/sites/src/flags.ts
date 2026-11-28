import { defineFlags, edgeConfigProvider, envProvider, resolveFlags, type FlagSite } from '@brianlusina/flags';

/** The sites' flags. See packages/flags/README.md. */
export const SITE_FLAGS = defineFlags({
  analytics: { default: false, description: 'GA4 behind the consent banner', sites: ['home', 'folio'] },
});

type SiteFlagName = keyof typeof SITE_FLAGS;

/**
 * The flags for one site, resolved Edge Config → SITES_FEATURES → default. Called while a page
 * renders (Site.astro), never from the middleware, which runs on every request: Edge Config allows
 * 100,000 reads a month on Hobby, and its provider caches each read for 5 minutes.
 */
export async function siteFlags(site: Exclude<FlagSite, 'blog'>): Promise<Partial<Record<SiteFlagName, boolean>>> {
  const names = (Object.keys(SITE_FLAGS) as SiteFlagName[]).filter(name => SITE_FLAGS[name].sites.includes(site));
  const defaults = Object.fromEntries(names.map(name => [name, SITE_FLAGS[name].default])) as Record<SiteFlagName, boolean>;
  return resolveFlags(defaults, [
    edgeConfigProvider(process.env.EDGE_CONFIG),
    envProvider(process.env.SITES_FEATURES, names, message => console.warn(`SITES_FEATURES: ${message}`)),
  ]);
}
