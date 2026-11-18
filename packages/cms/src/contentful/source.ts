import type { CMSAdapter } from '../adapter';
import type { CMSPage, CMSPageRequest, UnifiedPost } from '../types';
import { GET_BLOG_POSTS, GET_SEARCH_INDEX, getTagId, queryContentful } from './client';
import { mapContentfulPost, type ContentfulPostItem } from './map';

const SEARCH_INDEX_PAGE_SIZE = 100;

/**
 * Posts carry a tag either by name in the legacy `tags` field or as a Contentful tag, which can
 * only be filtered by its ID. Without the ID, the legacy field still matches by name.
 */
function tagFilters(name: string, id: string | undefined) {
  return [
    { tags_contains_some: [name] },
    ...(id ? [{ contentfulMetadata: { tags: { id_contains_some: [id] } } }] : []),
  ];
}

const mapItems = (items: unknown[]): UnifiedPost[] => (items as ContentfulPostItem[]).map(mapContentfulPost);

/**
 * Blog posts read straight from Contentful, server-side. Callers check isContentfulConfigured()
 * first. The cursor is the offset of the next post.
 */
export const contentfulSource: CMSAdapter = {
  source: 'contentful',

  async getPosts({ cursor, limit, category, tag }: CMSPageRequest): Promise<CMSPage> {
    if (cursor !== undefined && !/^\d+$/.test(cursor)) {
      throw new Error('Invalid cursor');
    }
    const skip = cursor ? Number(cursor) : 0;

    let tagListFailed = false;
    const tagId = tag
      ? await getTagId(tag).catch(error => {
          tagListFailed = true;
          console.error('Unable to look up the Contentful tag', error);
          return undefined;
        })
      : undefined;

    // The merged feed orders every source by publish date, newest first, so a post without one
    // has no place in it.
    const { blogPostCollection } = await queryContentful(GET_BLOG_POSTS, {
      skip,
      limit,
      order: ['publishDate_DESC'],
      where: {
        publishDate_exists: true,
        ...(category ? { category } : {}),
        ...(tag ? { OR: tagFilters(tag, tagId) } : {}),
      },
    });

    const next = skip + blogPostCollection.items.length;
    return {
      items: mapItems(blogPostCollection.items),
      nextCursor: next < blogPostCollection.total ? String(next) : null,
      // Without the tag list the answer may miss posts.
      ...(tagListFailed ? { partial: true as const } : {}),
    };
  },

  async getPostBySlug(slug: string): Promise<UnifiedPost | null> {
    const { blogPostCollection } = await queryContentful(GET_BLOG_POSTS, { limit: 1, where: { slug } });
    const [item] = mapItems(blogPostCollection.items);
    return item ?? null;
  },

  async getSearchIndex(): Promise<UnifiedPost[]> {
    const items: unknown[] = [];
    let total: number;
    do {
      const { blogPostCollection } = await queryContentful(GET_SEARCH_INDEX, {
        skip: items.length,
        limit: SEARCH_INDEX_PAGE_SIZE,
        order: ['publishDate_DESC'],
        where: { publishDate_exists: true },
      });
      items.push(...blogPostCollection.items);
      total = blogPostCollection.total;
      // An empty page before the total means the listing changed mid-read. Stop, so it can never
      // loop, and fail rather than return an index missing posts.
      if (blogPostCollection.items.length === 0 && items.length < total) {
        throw new Error('Contentful returned an empty page before the end of the listing');
      }
    } while (items.length < total);
    return mapItems(items);
  },
};
