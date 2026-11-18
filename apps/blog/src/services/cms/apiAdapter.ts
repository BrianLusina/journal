import CMSAdapter from './CMSAdapter';

const SOURCE_NAMES: Record<CMSSource, string> = { contentful: 'Contentful', notion: 'Notion' };

/**
 * The browser's view of one content source: its api/<source>/ routes, which hold the credentials
 * and already answer unified posts (see @brianlusina/cms).
 */
export function createApiAdapter(source: CMSSource): CMSAdapter {
  const name = SOURCE_NAMES[source];

  return {
    source,

    async getPosts({ cursor, limit, category, tag }: CMSPageRequest): Promise<CMSPage> {
      const params = new URLSearchParams({ limit: String(limit) });
      if (category) params.set('category', category);
      if (tag) params.set('tag', tag);
      if (cursor) params.set('cursor', cursor);
      const response = await fetch(`/api/${source}/posts?${params}`);
      if (!response.ok) {
        throw new Error(`Unable to fetch ${name} posts: ${response.status}`);
      }

      const payload = await response.json();
      return { items: payload.results, nextCursor: payload.nextCursor };
    },

    async getPostBySlug(slug: string): Promise<UnifiedPost | null> {
      const response = await fetch(`/api/${source}/posts/${encodeURIComponent(slug)}`);
      if (response.status === 404) return null;
      if (!response.ok) {
        throw new Error(`Unable to fetch ${name} post: ${response.status}`);
      }

      return (await response.json()).post;
    },

    async getSearchIndex(): Promise<UnifiedPost[]> {
      const response = await fetch(`/api/${source}/search-index`);
      if (!response.ok) {
        throw new Error(`Unable to fetch the ${name} search index: ${response.status}`);
      }

      return (await response.json()).results;
    },
  };
}
