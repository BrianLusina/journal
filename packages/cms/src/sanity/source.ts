import type { CMSAdapter } from '../adapter';
import type { CMSPage, CMSPageRequest, UnifiedPost } from '../types';
import { querySanity } from './client';
import { mapSanityPost } from './map';
import { POST_PROJECTION, SEARCH_PROJECTION, type SanityPost } from './projection';

// The merged feed orders every source by publish date, so a post without one has no place in it,
// and a post without a slug could never be opened.
const LISTED = '_type == "blogPost" && defined(slug.current) && defined(publishDate)';
const NEWEST_FIRST = '| order(publishDate desc)';

/**
 * Blog posts read straight from Sanity, server-side, published only. Callers check
 * isSanityConfigured() first. The cursor is the offset of the next post.
 */
export const sanitySource: CMSAdapter = {
  source: 'sanity',

  async getPosts({ cursor, limit, category, tag }: CMSPageRequest): Promise<CMSPage> {
    if (cursor !== undefined && !/^\d+$/.test(cursor)) {
      throw new Error('Invalid cursor');
    }
    const start = cursor ? Number(cursor) : 0;
    const filter = [LISTED, ...(category ? ['category == $category'] : []), ...(tag ? ['$tag in tags[]->name'] : [])].join(' && ');

    const { items, total } = await querySanity<{ items: SanityPost[]; total: number }>(
      `{ "items": *[${filter}] ${NEWEST_FIRST}[$start...$end]${POST_PROJECTION}, "total": count(*[${filter}]) }`,
      { start, end: start + limit, ...(category ? { category } : {}), ...(tag ? { tag } : {}) },
    );

    const next = start + items.length;
    return { items: items.map(mapSanityPost), nextCursor: next < total ? String(next) : null };
  },

  async getPostBySlug(slug: string): Promise<UnifiedPost | null> {
    const post = await querySanity<SanityPost | null>(`*[${LISTED} && slug.current == $slug][0]${POST_PROJECTION}`, { slug });
    return post ? mapSanityPost(post) : null;
  },

  async getSearchIndex(): Promise<UnifiedPost[]> {
    const posts = await querySanity<SanityPost[]>(`*[${LISTED}] ${NEWEST_FIRST}${SEARCH_PROJECTION}`, {});
    return posts.map(mapSanityPost);
  },
};
