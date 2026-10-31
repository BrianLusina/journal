import { useEffect } from 'react';
import { logSearch, type SearchSource } from '@/services/search/searchAnalytics';

/** How long typing has to pause before a query counts as settled. */
export const SETTLE_DELAY_MS = 1000;

/**
 * Logs `query` once typing has paused, rather than on every keystroke. Only while `ready`, so the
 * result count is real.
 */
export function useSettledSearchLog(query: string, resultsCount: number, source: SearchSource, ready: boolean): void {
  useEffect(() => {
    if (!ready) return undefined;
    const timer = setTimeout(() => logSearch(query, resultsCount, source), SETTLE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [query, resultsCount, source, ready]);
}
