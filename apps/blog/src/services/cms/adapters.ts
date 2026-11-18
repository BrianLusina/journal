import features from '@/config/features';
import CMSAdapter from './CMSAdapter';
import { createApiAdapter } from './apiAdapter';

/**
 * Every content source the site reads posts from. Order is priority order when two sources
 * publish the same slug. Adding a source means adding it to @brianlusina/cms and its api/ routes, then listing it here.
 * Notion is left out while the notion feature flag is off.
 */
const cmsAdapters: CMSAdapter[] = [
  createApiAdapter('contentful'),
  ...(features.notion ? [createApiAdapter('notion')] : []),
];

export default cmsAdapters;
