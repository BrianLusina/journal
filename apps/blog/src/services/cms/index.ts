import NotionAdapter from './NotionAdapter';
import ContentfulAdapter from './ContentfulAdapter';
import CmsAdapter from './CMSAdapter';
import cmsAdapters from './adapters';
import { createMergedFeed, findPostBySlug, type MergedFeed, type MergedPosts } from './aggregator';

export {
  NotionAdapter,
  ContentfulAdapter,
  type CmsAdapter,
  cmsAdapters,
  createMergedFeed,
  findPostBySlug,
  type MergedFeed,
  type MergedPosts,
};
