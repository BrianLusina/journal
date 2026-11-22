import features from '@/config/features';
import CMSAdapter from './CMSAdapter';
import { createApiAdapter } from './apiAdapter';

/**
 * Every content source the site reads posts from. Order is priority order when two sources
 * publish the same slug. Adding a source means adding it to @brianlusina/cms and its api/ routes, then listing it here.
 * Notion and Sanity are left out while their feature flags are off.
 */
const cmsAdapters: CMSAdapter[] = [
  createApiAdapter('contentful'),
  ...(features.notion ? [createApiAdapter('notion')] : []),
  ...(features.sanity ? [createApiAdapter('sanity')] : []),
];

export default cmsAdapters;
