import CMSAdapter from './CMSAdapter';
import ContentfulAdapter from './ContentfulAdapter';
import NotionAdapter from './NotionAdapter';

/**
 * Every content source the site reads posts from. Order is priority order when two sources
 * publish the same slug. Adding a source means implementing CMSAdapter and listing it here.
 */
const cmsAdapters: CMSAdapter[] = [new ContentfulAdapter(), new NotionAdapter()];

export default cmsAdapters;
