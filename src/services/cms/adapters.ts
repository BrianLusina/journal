import features from '@/config/features';
import CMSAdapter from './CMSAdapter';
import ContentfulAdapter from './ContentfulAdapter';
import NotionAdapter from './NotionAdapter';

/**
 * Every content source the site reads posts from. Order is priority order when two sources
 * publish the same slug. Adding a source means implementing CMSAdapter and listing it here.
 * Notion is left out while the notion feature flag is off.
 */
const cmsAdapters: CMSAdapter[] = [
  new ContentfulAdapter(),
  ...(features.notion ? [new NotionAdapter()] : []),
];

export default cmsAdapters;
