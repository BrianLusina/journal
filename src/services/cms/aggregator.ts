import CMSAdapter from './CMSAdapter';

export type MergedPosts = PaginatedUnifiedPosts & {
  /**
   * Errors from sources that failed while others succeeded. The feed is still usable,
   * but callers should report these.
   */
  errors: Error[];
};

const toError = (reason: unknown, fallback: string): Error =>
  reason instanceof Error ? reason : new Error(fallback);

const byPublishDateDesc = (a: UnifiedPost, b: UnifiedPost): number =>
  new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();

/**
 * Builds one paginated feed across all sources, newest first.
 *
 * Sources cannot paginate a merged feed on their own, so each one is asked for its first
 * `skip + limit` posts and the requested page is cut from the merged result. One failing source
 * does not hide the others; the call only rejects when every source fails.
 */
export async function fetchMergedPosts(
  adapters: CMSAdapter[],
  options: CMSPaginationOptions = {},
): Promise<MergedPosts> {
  const skip = options.skip || 0;
  const limit = options.limit || 100;

  const results = await Promise.allSettled(
    adapters.map(adapter =>
      adapter.getPosts({
        ...(options.category ? { category: options.category } : {}),
        skip: 0,
        limit: skip + limit,
      }),
    ),
  );

  const pages: PaginatedUnifiedPosts[] = [];
  const errors: Error[] = [];
  results.forEach(result => {
    if (result.status === 'fulfilled') {
      pages.push(result.value);
    } else {
      errors.push(toError(result.reason, 'Unable to fetch posts'));
    }
  });

  if (pages.length === 0 && errors.length > 0) {
    throw errors[0];
  }

  const merged = pages.flatMap(page => page.items).sort(byPublishDateDesc);

  return {
    items: merged.slice(skip, skip + limit),
    total: pages.reduce((sum, page) => sum + page.total, 0),
    limit,
    skip,
    hasMore: merged.length > skip + limit || pages.some(page => Boolean(page.hasMore)),
    errors,
  };
}

/**
 * Looks a slug up in every source. Adapter order is priority order when more than one source
 * has the slug. Resolves to null only when every source answered that the post does not exist.
 */
export async function findPostBySlug(adapters: CMSAdapter[], slug: string): Promise<UnifiedPost | null> {
  const results = await Promise.allSettled(adapters.map(adapter => adapter.getPostBySlug(slug)));

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      return result.value;
    }
  }

  const failure = results.find((result): result is PromiseRejectedResult => result.status === 'rejected');
  if (failure) {
    throw toError(failure.reason, 'Unable to fetch post');
  }

  return null;
}
