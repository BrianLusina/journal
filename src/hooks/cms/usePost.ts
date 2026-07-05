import { useState, useEffect } from 'react';
import { ContentfulAdapter } from '@services/cms/ContentfulAdapter';
import { NotionAdapter } from '@services/cms/NotionAdapter';

const adapters = [new ContentfulAdapter(), new NotionAdapter()];

export function usePost(slug: string | undefined) {
  const [data, setData] = useState<UnifiedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!slug) {
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
        const promises = adapters.map(adapter => adapter.getPostBySlug(slug));
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
        } else {
          setError(new Error('Post not found'));
        }
      } catch (err: any) {
        if (isMounted) setError(err);
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
