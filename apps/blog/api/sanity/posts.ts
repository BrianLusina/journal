import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sanitySource, isSanityConfigured } from '@brianlusina/cms/server';
import { getLimit, getParam, methodNotAllowed, POSTS_CACHE_CONTROL } from '../_routes';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<VercelResponse> {
  if (request.method !== 'GET') {
    return methodNotAllowed(response);
  }

  if (!isSanityConfigured()) {
    return response.status(500).json({ error: 'Sanity is not configured' });
  }

  // The cursor is the offset of the next post.
  const cursor = getParam(request.query.cursor);
  if (cursor && !/^\d+$/.test(cursor)) {
    return response.status(400).json({ error: 'Invalid cursor' });
  }
  const category = getParam(request.query.category);
  const tag = getParam(request.query.tag);

  try {
    const page = await sanitySource.getPosts({
      limit: getLimit(request.query.limit),
      ...(cursor ? { cursor } : {}),
      ...(category ? { category } : {}),
      ...(tag ? { tag } : {}),
    });

    response.setHeader('Cache-Control', POSTS_CACHE_CONTROL);

    return response.status(200).json({ results: page.items, nextCursor: page.nextCursor });
  } catch (error) {
    console.error('Unable to fetch Sanity posts', error);
    return response.status(502).json({ error: 'Unable to fetch Sanity posts' });
  }
}
