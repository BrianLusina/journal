import { useState, useEffect } from 'react';
import { ContentfulAdapter } from '@services/cms/ContentfulAdapter';
import { NotionAdapter } from '@services/cms/NotionAdapter';

export function usePost(slug: string | undefined) {
  const [data, setData] = useState<UnifiedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!slug) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchPost() {
      setLoading(true);
      setError(null);

      try {
        // Query adapters sequentially or concurrently. 
        // We'll try them concurrently and return the first one that has the post.
        const promises = [new ContentfulAdapter(), new NotionAdapter()].map(adapter =>
          adapter.getPostBySlug(slug),
        );
        const results = await Promise.allSettled(promises);

        if (!isMounted) return;

        let foundPost: UnifiedPost | null = null;

        for (const result of results) {
          if (result.status === 'fulfilled' && result.value) {
            foundPost = result.value;
            break;
          }
        }

        if (foundPost) {
          setData(foundPost);
          return;
        }

        const failedRequest = results.find(result => result.status === 'rejected');
        if (failedRequest && failedRequest.status === 'rejected') {
          const reason = failedRequest.reason;
          setError(reason instanceof Error ? reason : new Error('Unable to fetch post'));
        } else {
          setError(new Error('Post not found'));
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unable to fetch post'));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchPost();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  return { data, loading, error };
}
