import type { SiteId } from './registry';

/** Each site's public pages, for its sitemap. Add a path here when a site gains a page. */
export const ROUTES: Record<SiteId, string[]> = {
  home: ['/'],
  folio: ['/'],
};
