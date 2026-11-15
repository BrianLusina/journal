import type CMSAdapter from '@/services/cms/CMSAdapter';
import type { SearchDocument } from './SearchDocument';

export type SearchIndex = {
  documents: SearchDocument[];
  /** Errors from sources that failed while others answered. Callers should report these. */
  errors: Error[];
};

const toDocument = (post: UnifiedPost): SearchDocument => ({
  key: `${post.source}:${post.id}`,
  id: post.id,
  source: post.source,
  slug: post.slug,
  title: post.title,
  subtitle: post.subtitle,
  description: post.description,
  category: post.category,
  tags: post.tags,
  authors: post.authors.flatMap(author => (author.name ? [author.name] : [])),
  publishDate: post.publishDate,
  thumbnailUrl: post.thumbnail?.url,
});

/**
 * The search index of every source in `adapters`, read concurrently. A failing source is left out
 * and its error returned, as the merged feed does; it rejects only when every source failed.
 */
export async function loadSearchIndex(adapters: CMSAdapter[]): Promise<SearchIndex> {
  const results = await Promise.allSettled(adapters.map(adapter => adapter.getSearchIndex()));
  const errors = results.flatMap(result =>
    result.status === 'rejected'
      ? [result.reason instanceof Error ? result.reason : new Error('Unable to fetch the search index')]
      : [],
  );
  if (errors.length > 0 && errors.length === results.length) {
    throw errors[0];
  }

  // Offset pages shift when a post is published while the index is read, so a post can come twice.
  const documents = new Map<string, SearchDocument>();
  results.forEach(result => {
    if (result.status === 'fulfilled') {
      result.value.map(toDocument).forEach(document => documents.set(document.key, document));
    }
  });

  return { documents: [...documents.values()], errors };
}
