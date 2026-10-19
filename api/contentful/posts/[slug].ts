import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, POSTS_CACHE_CONTROL } from '../../_routes';
import { GET_BLOG_POSTS, isContentfulConfigured, queryContentful } from '../_shared';

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

  if (typeof request.query.slug !== 'string') {
    return response.status(400).json({ error: 'Invalid request' });
  }

  try {
    const { blogPostCollection } = await queryContentful(GET_BLOG_POSTS, {
      limit: 1,
      where: { slug: request.query.slug },
    });

    if (blogPostCollection.items.length === 0) {
      return response.status(404).json({ error: 'Post not found' });
    }

    response.setHeader('Cache-Control', POSTS_CACHE_CONTROL);

    return response.status(200).json({ post: blogPostCollection.items[0] });
  } catch (error) {
    console.error('Unable to fetch Contentful post', error);
    return response.status(502).json({ error: 'Unable to fetch Contentful post' });
  }
}
