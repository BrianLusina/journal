// The browser-safe entry: models, the CMSAdapter seam and the merged feed. Nothing reachable from
// here may read credentials or import a CMS client; those live behind server.ts.
export type * from './src/types';
export type { CMSAdapter } from './src/adapter';
export { createMergedFeed, findPostBySlug, type MergedFeed, type MergedPosts } from './src/aggregator';
