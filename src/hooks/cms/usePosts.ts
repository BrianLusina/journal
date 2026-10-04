import { useState, useEffect } from 'react';
import { captureException } from '@monitoring';
import { cmsAdapters, fetchMergedPosts } from '@cmsService';

export function usePosts(options?: CMSPaginationOptions) {
  const [data, setData] = useState<PaginatedUnifiedPosts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { category, skip, limit } = options || {};

  useEffect(() => {
    let isMounted = true;

    async function fetchPosts() {
      setLoading(true);
      setError(null);

      try {
        const { errors, ...posts } = await fetchMergedPosts(cmsAdapters, { category, skip, limit });
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
  }, [category, skip, limit]);

  return { data, loading, error };
}
