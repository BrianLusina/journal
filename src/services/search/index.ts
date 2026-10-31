import { addBreadcrumb, captureException } from '@monitoring';
import { cmsAdapters } from '@cmsService';
import { loadSearchIndex } from './searchIndex';
import { createSearchEngine } from './searchEngine';
import type { SearchEngine } from './SearchDocument';

let engine: Promise<SearchEngine> | undefined;

/**
 * The search over every registered source, loaded on first use and shared from then on. Import
 * this module with import(): it holds MiniSearch, which stays out of the initial bundle. A failed
 * load is not kept, so the next call retries.
 */
export function loadSearchEngine(): Promise<SearchEngine> {
  if (!engine) {
    const startedAt = performance.now();
    engine = loadSearchIndex(cmsAdapters).then(({ documents, errors }) => {
      // A failing source narrows the results instead of hiding them, so report it rather than surface it.
      errors.forEach(error => captureException(error));
      // Shows the index growing toward the size where search should move to the server.
      addBreadcrumb({
        category: 'search',
        message: 'Search index loaded',
        data: { documents: documents.length, durationMs: Math.round(performance.now() - startedAt) },
      });
      return createSearchEngine(documents);
    });
    engine.catch(() => {
      engine = undefined;
    });
  }
  return engine;
}

export { MIN_QUERY_LENGTH, type SearchDocument, type SearchEngine } from './SearchDocument';
