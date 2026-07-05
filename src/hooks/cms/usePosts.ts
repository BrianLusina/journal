import { useState, useEffect } from 'react';
import { ContentfulAdapter } from '@services/cms/ContentfulAdapter';
import { NotionAdapter } from '@services/cms/NotionAdapter';

const adapters = [new ContentfulAdapter(), new NotionAdapter()];

export function usePosts(options?: CMSPaginationOptions) {
  const [data, setData] = useState<PaginatedUnifiedPosts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchPosts() {
      setLoading(true);
      try {
        const promises = adapters.map(adapter => adapter.getPosts(options));
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

        // Compute total items and limit
        const total = results.reduce((sum, result) => sum + result.total, 0);

        setData({
          items: allItems,
          total,
          limit: options?.limit || 100,
          skip: options?.skip || 0,
        });
      } catch (err: any) {
        if (isMounted) {
          setError(err);
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
  }, [options?.skip, options?.limit]);

  return { data, loading, error };
}
