import MiniSearch from 'minisearch';
import { MIN_QUERY_LENGTH, type SearchDocument, type SearchEngine } from './SearchDocument';

const MAX_RESULTS = 50;

/** One typo is forgiven in a word of five characters or more; shorter words must match. */
const fuzzy = (term: string): number => (term.length >= 5 ? 1 : 0);

/**
 * Ranks `documents` with MiniSearch: every word of the query must match (as a prefix, or with one
 * typo in a longer word), and a match in the title counts most, then tags, then subtitle and
 * description, then author and category.
 */
export function createSearchEngine(documents: SearchDocument[]): SearchEngine {
  const byKey = new Map(documents.map(document => [document.key, document]));
  const index = new MiniSearch<SearchDocument>({
    idField: 'key',
    fields: ['title', 'tags', 'subtitle', 'description', 'authors', 'category'],
    // Tags and authors are arrays; index their values as one text.
    extractField: (document, field) => {
      const value = document[field as keyof SearchDocument];
      return Array.isArray(value) ? value.join(' ') : (value as string | undefined) ?? '';
    },
    searchOptions: {
      boost: { title: 5, tags: 3, subtitle: 2, description: 2, authors: 1, category: 1 },
      prefix: true,
      fuzzy,
      combineWith: 'AND',
    },
  });
  index.addAll(documents);

  return {
    search(query) {
      const trimmed = query.trim();
      if (trimmed.length < MIN_QUERY_LENGTH) return [];
      return index
        .search(trimmed)
        .slice(0, MAX_RESULTS)
        .map(result => byKey.get(result.id) as SearchDocument);
    },
  };
}
