import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getLimit, getParam, methodNotAllowed, POSTS_CACHE_CONTROL } from '../_routes';
import { GET_BLOG_POSTS, getTagId, isContentfulConfigured, queryContentful } from './_shared';

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

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<VercelResponse> {
  if (request.method !== 'GET') {
    return methodNotAllowed(response);
  }

  if (!isContentfulConfigured()) {
    return response.status(500).json({ error: 'Contentful is not configured' });
  }

  const limit = getLimit(request.query.limit);
  // The cursor is the offset of the next post.
  const cursor = getParam(request.query.cursor);
  if (cursor && !/^\d+$/.test(cursor)) {
    return response.status(400).json({ error: 'Invalid cursor' });
  }
  const skip = cursor ? Number(cursor) : 0;
  const category = getParam(request.query.category);
  const tag = getParam(request.query.tag);

  try {
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
    // Without the tag list the answer may miss posts, so it must not stay in the edge cache.
    if (!tagListFailed) {
      response.setHeader('Cache-Control', POSTS_CACHE_CONTROL);
    }

    return response.status(200).json({
      results: blogPostCollection.items,
      nextCursor: next < blogPostCollection.total ? String(next) : null,
    });
  } catch (error) {
    console.error('Unable to fetch Contentful posts', error);
    return response.status(502).json({ error: 'Unable to fetch Contentful posts' });
  }
}
