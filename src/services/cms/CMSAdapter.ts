export interface CMSAdapter {
  /**
   * Identifies the source name for the adapter.
   */
  readonly source: CMSSource;

  /**
   * Retrieves a paginated list of posts.
   * @param options Pagination options (skip, limit).
   */
  getPosts(options?: CMSPaginationOptions): Promise<PaginatedUnifiedPosts>;

  /**
   * Retrieves a single post by its slug.
   * @param slug The URL slug of the post.
   */
  getPostBySlug(slug: string): Promise<UnifiedPost | null>;
}
