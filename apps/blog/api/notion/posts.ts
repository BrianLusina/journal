import type { VercelRequest, VercelResponse } from '@vercel/node';
import { notionSource, isNotionConfigured } from '@brianlusina/cms/server';
import { getLimit, getParam, methodNotAllowed, POSTS_CACHE_CONTROL } from '../_routes';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<VercelResponse> {
  if (request.method !== 'GET') {
    return methodNotAllowed(response);
  }

  if (!isNotionConfigured()) {
    return response.status(500).json({ error: 'Notion is not configured' });
  }

  // Notion's own cursor, passed on as it is.
  const cursor = getParam(request.query.cursor);
  const category = getParam(request.query.category);
  const tag = getParam(request.query.tag);

  try {
    const page = await notionSource.getPosts({
      limit: getLimit(request.query.limit),
      ...(cursor ? { cursor } : {}),
      ...(category ? { category } : {}),
      ...(tag ? { tag } : {}),
    });

    response.setHeader('Cache-Control', POSTS_CACHE_CONTROL);

    return response.status(200).json({ results: page.items, nextCursor: page.nextCursor });
  } catch (error) {
    console.error('Unable to fetch Notion posts', error);
    return response.status(502).json({ error: 'Unable to fetch Notion posts' });
  }
}
