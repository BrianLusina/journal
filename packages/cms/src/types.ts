/**
 * The source of the content.
 */
export type CMSSource = 'contentful' | 'notion';

/**
 * A unified author model. It carries everything needed to display the author, so the UI never
 * looks an author up again; `id` is only meaningful within `source`.
 */
export type UnifiedAuthor = {
  id: string;
  source: CMSSource;
  name?: string;
  avatarUrl?: string;
  shortBio?: string;
};

/**
 * A unified asset model.
 */
export type UnifiedAsset = {
  url: string;
  description?: string;
  title?: string;
};

/**
 * A unified post model that abstracts away the underlying CMS (Contentful vs Notion).
 */
export type UnifiedPost = {
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
 * Narrows a feed to the posts in one category and/or carrying one tag, by the tag's name.
 */
export type CMSPostFilter = {
  category?: string;
  tag?: string;
};

/**
 * Options for reading the merged feed: the first `limit` posts, optionally filtered.
 */
export type CMSPaginationOptions = CMSPostFilter & {
  limit?: number;
};

/**
 * The first posts of the merged feed, newest first.
 */
export type PaginatedUnifiedPosts = {
  items: UnifiedPost[];
  hasMore: boolean;
};

/**
 * A request to one source for its next page of posts, newest first. `cursor` is opaque and comes
 * from the previous page's `nextCursor`; omit it for the first page.
 */
export type CMSPageRequest = CMSPostFilter & {
  cursor?: string;
  limit: number;
};

/**
 * One page from a source. `nextCursor` is null when the source has no more posts.
 */
export type CMSPage = {
  items: UnifiedPost[];
  nextCursor: string | null;
  /**
   * Set when the source answered without everything it should have (for example, Contentful's tag
   * list could not be read), so the answer must not be cached.
   */
  partial?: true;
};
