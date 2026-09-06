import { useState, useEffect } from 'react';
import { ContentfulAdapter } from '@services/cms/ContentfulAdapter';
import { NotionAdapter } from '@services/cms/NotionAdapter';

const DEFAULT_LIMIT = 100;

export function usePosts(options?: CMSPaginationOptions) {
  const [data, setData] = useState<PaginatedUnifiedPosts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { category, skip: requestedSkip, limit: requestedLimit } = options || {};

  useEffect(() => {
    let isMounted = true;

    async function fetchPosts() {
      setLoading(true);
      setError(null);

      const skip = requestedSkip || 0;
      const limit = requestedLimit || DEFAULT_LIMIT;

      try {
        // Fetch enough items from every source to build one globally paginated feed.
        const promises = [new ContentfulAdapter(), new NotionAdapter()].map(adapter =>
          adapter.getPosts({
            ...(category ? { category } : {}),
            skip: 0,
            limit: skip + limit,
          }),
        );
        const results = await Promise.all(promises);

        if (!isMounted) return;

        // Combine all items
        const allItems = results.flatMap(result => result.items);

        // Sort items by publishDate descending
        allItems.sort((a, b) => {
          const dateA = new Date(a.publishDate).getTime();
          const dateB = new Date(b.publishDate).getTime();
          return dateB - dateA;
        });

        const total = results.reduce((sum, result) => sum + result.total, 0);
        const hasMore = results.some(result => result.hasMore || result.total > result.skip + result.items.length);

        setData({
          items: allItems.slice(skip, skip + limit),
          total,
          limit,
          skip,
          hasMore,
        });
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
  }, [category, requestedSkip, requestedLimit]);

  return { data, loading, error };
}
