export default interface CMSAdapter {
  /**
   * Identifies the source name for the adapter.
   */
  readonly source: CMSSource;

  /**
   * Retrieves the next page of posts, newest first by publish date, so the aggregator can merge
   * sources page by page.
   */
  getPosts(request: CMSPageRequest): Promise<CMSPage>;

  /**
   * Retrieves a single post by its slug.
   * @param slug The URL slug of the post.
   */
  getPostBySlug(slug: string): Promise<UnifiedPost | null>;
}
