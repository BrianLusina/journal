/** Shorter queries match too much of the index to be useful. */
export const MIN_QUERY_LENGTH = 2;

/**
 * What the search index holds for one post: the fields a post is found by, and what a result
 * shows. A post's body is not searched.
 */
export type SearchDocument = {
  /** `source:id`, unique across sources. */
  key: string;
  id: string;
  source: CMSSource;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  category?: string;
  tags: string[];
  authors: string[];
  publishDate: string;
  thumbnailUrl?: string;
};

/** A search over the index. Ranking, matching and where the index lives stay behind this. */
export interface SearchEngine {
  /** The documents matching `query`, best match first. */
  search(query: string): SearchDocument[];
}
