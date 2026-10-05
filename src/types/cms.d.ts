/**
 * The source of the content.
 */
declare type CMSSource = 'contentful' | 'notion';

/**
 * A unified author model. It carries everything needed to display the author, so the UI never
 * looks an author up again; `id` is only meaningful within `source`.
 */
declare type UnifiedAuthor = {
  id: string;
  source: CMSSource;
  name?: string;
  avatarUrl?: string;
  shortBio?: string;
};

/**
 * A unified asset model.
 */
declare type UnifiedAsset = {
  url: string;
  description?: string;
  title?: string;
};

/**
 * A unified post model that abstracts away the underlying CMS (Contentful vs Notion).
 */
declare type UnifiedPost = {
  id: string;
  source: CMSSource;
  title: string;
  subtitle?: string;
  description?: string;
  category?: string;
  slug: string;
  body?: string;
  publishDate: string;
  heroImage?: UnifiedAsset;
  thumbnail?: UnifiedAsset;
  tags: string[];
  authors: UnifiedAuthor[];
};

/**
 * Options for reading the merged feed: the first `limit` posts, optionally in one category.
 */
declare type CMSPaginationOptions = {
  limit?: number;
  category?: string;
};

/**
 * The first posts of the merged feed, newest first.
 */
declare type PaginatedUnifiedPosts = {
  items: UnifiedPost[];
  hasMore: boolean;
};

/**
 * A request to one source for its next page of posts, newest first. `cursor` is opaque and comes
 * from the previous page's `nextCursor`; omit it for the first page.
 */
declare type CMSPageRequest = {
  cursor?: string;
  limit: number;
  category?: string;
};

/**
 * One page from a source. `nextCursor` is null when the source has no more posts.
 */
declare type CMSPage = {
  items: UnifiedPost[];
  nextCursor: string | null;
};
