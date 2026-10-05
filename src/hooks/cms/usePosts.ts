import { useState, useEffect, useRef } from 'react';
import { captureException } from '@monitoring';
import { cmsAdapters, createMergedFeed, type MergedFeed } from '@cmsService';

const DEFAULT_LIMIT = 100;

/**
 * The first `limit` posts across every CMS, newest first. Raising `limit` (e.g. "Load more")
 * reads on from where the feed stopped rather than refetching; a new category starts a new feed.
 */
export function usePosts(options?: CMSPaginationOptions) {
  const [data, setData] = useState<PaginatedUnifiedPosts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { category, limit = DEFAULT_LIMIT } = options || {};
  const feed = useRef<{ category?: string; feed: MergedFeed } | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!feed.current || feed.current.category !== category) {
      feed.current = { category, feed: createMergedFeed(cmsAdapters, category) };
    }
    const current = feed.current.feed;

    async function fetchPosts() {
      setLoading(true);
      setError(null);

      try {
        const { errors, ...posts } = await current.load(limit);
        if (!isMounted) return;

        // A failing source degrades the feed instead of hiding it, so report it rather than surface it.
        errors.forEach(sourceError => captureException(sourceError));
        setData(posts);
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unable to fetch posts'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchPosts();

    return () => {
      isMounted = false;
    };
  }, [category, limit]);

  return { data, loading, error };
}
