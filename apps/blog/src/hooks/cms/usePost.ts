import { useState, useEffect } from 'react';
import { cmsAdapters, findPostBySlug } from '@cmsService';

/**
 * Loads a post by slug from whichever source has it. `data` is null with no `error` when no
 * source has the slug, so callers can tell "not found" apart from "failed to load".
 */
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

    async function fetchPost(postSlug: string) {
      setLoading(true);
      setError(null);

      try {
        const post = await findPostBySlug(cmsAdapters, postSlug);
        if (isMounted) setData(post);
      } catch (err: unknown) {
        if (isMounted) {
          setData(null);
          setError(err instanceof Error ? err : new Error('Unable to fetch post'));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchPost(slug);

    return () => {
      isMounted = false;
    };
  }, [slug]);

  return { data, loading, error };
}
