import { test as base, expect } from '../fixtures';
import registry from '../../apps/sites/sites.config.json';

type SiteId = 'home' | 'folio';

const registeredHosts = new Set(Object.values(registry.environments).flatMap(hosts => Object.values(hosts)));

/** A preview URL serves every site, chosen by the `site` cookie; a registered host serves its own. */
export const isPreview = (baseURL: string) => !registeredHosts.has(new URL(baseURL).host);
const productionHosts = new Set(Object.values(registry.environments.production));


export const test = base.extend<{ site: SiteId }>({
  site: ['home', { option: true }],

  page: async ({ page, site, baseURL }, use) => {
    // Every host outside production honours the cookie (a registered staging or local host too);
    // production refuses it, so it is not sent there.
    if (baseURL && !productionHosts.has(new URL(baseURL).host)) {
      await page.context().addCookies([{ name: 'site', value: site, url: baseURL }]);
    }
    await use(page);
  },
});

export { expect };
