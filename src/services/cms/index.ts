import NotionAdapter from './NotionAdapter';
import ContentfulAdapter from './ContentfulAdapter';
import CmsAdapter from './CMSAdapter';
import cmsAdapters from './adapters';
import { fetchMergedPosts, findPostBySlug, type MergedPosts } from './aggregator';

export {
  NotionAdapter,
  ContentfulAdapter,
  type CmsAdapter,
  cmsAdapters,
  fetchMergedPosts,
  findPostBySlug,
  type MergedPosts,
};
