import { addBreadcrumb, captureException } from '@monitoring';
import { cmsAdapters } from '@cmsService';
import { loadSearchIndex } from './searchIndex';
import { createSearchEngine } from './searchEngine';
import type { SearchEngine } from './SearchDocument';

/**
 * How long a loaded engine is reused. It matches the index routes' edge cache, so new posts reach
 * an open tab about as soon as the feed shows them, and Notion's signed thumbnail links, which
 * expire after an hour, are never served stale.
 */
export const SEARCH_ENGINE_TTL_MS = 5 * 60 * 1000;

let cached: { loadedAt: number; engine: Promise<SearchEngine> } | undefined;

/**
 * The search over every registered source, loaded on first use and shared for a few minutes.
 * Import this module with import(): it holds MiniSearch, which stays out of the initial bundle.
 * A failed load, or one that is missing a failed source, is not kept, so the next call retries.
 */
export function loadSearchEngine(): Promise<SearchEngine> {
  if (cached && Date.now() - cached.loadedAt <= SEARCH_ENGINE_TTL_MS) {
    return cached.engine;
  }
  const startedAt = performance.now();
  const entry = {
    loadedAt: Date.now(),
    engine: loadSearchIndex(cmsAdapters).then(({ documents, errors }) => {
      if (errors.length > 0) {
        // A failing source narrows the results instead of hiding them, so report it rather than
        // surface it, and load again next time rather than leave it out for the whole visit.
        errors.forEach(error => captureException(error));
        forget(entry);
      }
      // Shows the index growing toward the size where search should move to the server.
      addBreadcrumb({
        category: 'search',
        message: 'Search index loaded',
        data: { documents: documents.length, durationMs: Math.round(performance.now() - startedAt) },
      });
      return createSearchEngine(documents);
    }),
  };
  cached = entry;
  entry.engine.catch(() => forget(entry));
  return entry.engine;
}

function forget(entry: typeof cached): void {
  if (cached === entry) cached = undefined;
}

/** Forgets the loaded engine. For tests. */
export function resetSearchEngine(): void {
  cached = undefined;
}

export { MIN_QUERY_LENGTH, type SearchDocument, type SearchEngine } from './SearchDocument';
