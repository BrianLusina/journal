import CMSAdapter from './CMSAdapter';

export type MergedPosts = PaginatedUnifiedPosts & {
  /**
   * Errors from sources that failed during this load while others succeeded. The feed is still
   * usable, but callers should report these.
   */
  errors: Error[];
};

export type MergedFeed = {
  /**
   * Resolves to the first `count` posts of the merged feed. Posts already loaded are kept, so a
   * larger count only fetches what is missing from each source.
   */
  load(count: number): Promise<MergedPosts>;
};

type SourceState = {
  adapter: CMSAdapter;
  buffer: UnifiedPost[];
  cursor?: string;
  exhausted: boolean;
  /** Failed during the current load; it is retried from its cursor on the next one. */
  failed: boolean;
};

/** Fetching a handful of posts per request would make every small load a round trip per post. */
const MIN_PAGE_SIZE = 10;

const toError = (reason: unknown, fallback: string): Error =>
  reason instanceof Error ? reason : new Error(fallback);

const publishTime = (post: UnifiedPost): number => new Date(post.publishDate).getTime();

/**
 * One feed across all sources, newest first, read page by page.
 *
 * Every source returns its posts newest first, so the feed is a k-way merge: it keeps a cursor and
 * a buffer per source, and only fetches a source's next page when its buffer runs out. Loading
 * more never refetches what was already read. A failing source is left out of the load instead of
 * hiding the others, and retried on the next load; posts it would have placed among those already
 * shown then appear after them. A load only rejects when every source failed and nothing was read.
 */
export function createMergedFeed(adapters: CMSAdapter[], filter: CMSPostFilter = {}): MergedFeed {
  const sources: SourceState[] = adapters.map(adapter => ({ adapter, buffer: [], exhausted: false, failed: false }));
  const merged: UnifiedPost[] = [];
  // Offset pages shift when posts are published between requests, so a post can be served twice.
  const seen = new Set<string>();
  let queue: Promise<unknown> = Promise.resolve();

  const isLive = (source: SourceState) => !source.exhausted && !source.failed;

  const fetchNextPage = async (source: SourceState, limit: number, errors: Error[]): Promise<void> => {
    try {
      const page = await source.adapter.getPosts({
        ...filter,
        ...(source.cursor ? { cursor: source.cursor } : {}),
        limit,
      });
      source.buffer.push(...page.items);
      source.exhausted = page.nextCursor === null;
      source.cursor = page.nextCursor ?? undefined;
    } catch (error) {
      source.failed = true;
      errors.push(toError(error, 'Unable to fetch posts'));
    }
  };

  const loadUntil = async (count: number): Promise<MergedPosts> => {
    const errors: Error[] = [];
    sources.forEach(source => {
      source.failed = false;
    });

    while (merged.length < count) {
      // The next post can only be chosen once every live source has a candidate, and a page can
      // come back empty while the source still has more.
      let empty = sources.filter(source => source.buffer.length === 0 && isLive(source));
      while (empty.length > 0) {
        const limit = Math.max(count - merged.length, MIN_PAGE_SIZE);
        await Promise.all(empty.map(source => fetchNextPage(source, limit, errors)));
        empty = empty.filter(source => source.buffer.length === 0 && isLive(source));
      }

      const candidates = sources.filter(source => source.buffer.length > 0);
      if (candidates.length === 0) break;

      const newest = candidates.reduce((best, source) =>
        publishTime(source.buffer[0]) > publishTime(best.buffer[0]) ? source : best,
      );
      const post = newest.buffer.shift() as UnifiedPost;
      const key = `${post.source}:${post.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(post);
      }
    }

    if (merged.length === 0 && errors.length > 0 && sources.every(source => source.failed)) {
      throw errors[0];
    }

    return {
      items: merged.slice(0, count),
      hasMore: merged.length > count || sources.some(source => source.buffer.length > 0 || !source.exhausted),
      errors,
    };
  };

  return {
    load(count) {
      // Serialize loads so overlapping calls never fetch the same cursor twice.
      const result = queue.then(() => loadUntil(count));
      queue = result.catch(() => undefined);
      return result;
    },
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
