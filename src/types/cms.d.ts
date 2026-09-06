/**
 * The source of the content.
 */
declare type CMSSource = 'contentful' | 'notion';

/**
 * A unified author model.
 */
declare type UnifiedAuthor = {
  id: string;
  name?: string;
  avatarUrl?: string;
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
 * Pagination options for fetching unified posts.
 */
declare type CMSPaginationOptions = {
  skip?: number;
  limit?: number;
  category?: string;
};

/**
 * Result object for paginated posts.
 */
declare type PaginatedUnifiedPosts = {
  items: UnifiedPost[];
  total: number;
  limit: number;
  skip: number;
  hasMore?: boolean;
};
