import { useCallback, useEffect, useMemo, useState } from 'react';
// Types and the constant only: the search module itself is loaded with import() below.
import { MIN_QUERY_LENGTH, type SearchDocument, type SearchEngine } from '@/services/search/SearchDocument';

export { MIN_QUERY_LENGTH };

export type SearchStatus = 'loading' | 'ready' | 'error';

/**
 * The posts matching `query`, best match first. The search module and its index load the first
 * time any search is shown, and are shared after that, so typing never makes a request. The engine
 * is asked for again whenever `active` turns true (the modal opening), which picks up a newer index
 * once the shared one has expired; the current results stay up meanwhile.
 */
export function useSearch(query: string, active = true) {
  const [engine, setEngine] = useState<SearchEngine | null>(null);
  const [status, setStatus] = useState<SearchStatus>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!active) return undefined;
    let isMounted = true;
    setStatus(current => (current === 'ready' ? current : 'loading'));
    import('@/services/search')
      .then(search => search.loadSearchEngine())
      .then(loaded => {
        if (!isMounted) return;
        setEngine(loaded);
        setStatus('ready');
      })
      .catch(() => {
        if (isMounted) setStatus('error');
      });
    return () => {
      isMounted = false;
    };
  }, [attempt, active]);

  const results = useMemo<SearchDocument[]>(() => (engine ? engine.search(query) : []), [engine, query]);
  const retry = useCallback(() => setAttempt(count => count + 1), []);

  return { status, results, retry };
}
