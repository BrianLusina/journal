import type { VercelRequest, VercelResponse } from '@vercel/node';
import { contentfulSource, isContentfulConfigured } from '@brianlusina/cms/server';
import { getLimit, getParam, methodNotAllowed, POSTS_CACHE_CONTROL } from '../_routes';

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

  // The cursor is the offset of the next post.
  const cursor = getParam(request.query.cursor);
  if (cursor && !/^\d+$/.test(cursor)) {
    return response.status(400).json({ error: 'Invalid cursor' });
  }
  const category = getParam(request.query.category);
  const tag = getParam(request.query.tag);

  try {
    const page = await contentfulSource.getPosts({
      limit: getLimit(request.query.limit),
      ...(cursor ? { cursor } : {}),
      ...(category ? { category } : {}),
      ...(tag ? { tag } : {}),
    });

    // A partial answer may miss posts, so it must not stay in the edge cache.
    if (!page.partial) {
      response.setHeader('Cache-Control', POSTS_CACHE_CONTROL);
    }

    return response.status(200).json({ results: page.items, nextCursor: page.nextCursor });
  } catch (error) {
    console.error('Unable to fetch Contentful posts', error);
    return response.status(502).json({ error: 'Unable to fetch Contentful posts' });
  }
}
