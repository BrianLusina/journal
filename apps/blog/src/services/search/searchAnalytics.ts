import analytics from '@/services/analytics';
import { mayBePersonal, normalizeSearchTerm } from '@brianlusina/analytics';
import { MIN_QUERY_LENGTH } from './SearchDocument';

/** Where a search was made. */
export type SearchSource = 'modal' | 'page';

// The sanitisers live in @brianlusina/analytics, shared with apps/sites.
export { mayBePersonal, normalizeSearchTerm };

// Shared by the modal and the page, so following "See all results" doesn't log the term again.
let lastLoggedTerm: string | undefined;

/**
 * Sends a GA4 `search` event for a settled query: once it is submitted, a result is opened, or
 * typing has paused. A term that may be personal, or the same as the last one sent, isn't sent.
 * The analytics service only sends in production.
 */
export function logSearch(term: string, resultsCount: number, source: SearchSource): void {
  // Checked before the term is cut, so personal data straddling the cut is still caught.
  if (mayBePersonal(term)) return;
  const searchTerm = normalizeSearchTerm(term);
  if (searchTerm.length < MIN_QUERY_LENGTH || searchTerm === lastLoggedTerm) return;
  lastLoggedTerm = searchTerm;
  analytics.logEvent('search', { search_term: searchTerm, results_count: resultsCount, source });
}

/** Sends a GA4 `select_content` event for an opened result. */
export function logSearchSelection(slug: string, source: SearchSource): void {
  analytics.logEvent('select_content', { content_type: 'post', item_id: slug, source });
}

/** Forgets the last term sent. For tests. */
export function resetSearchLog(): void {
  lastLoggedTerm = undefined;
}
