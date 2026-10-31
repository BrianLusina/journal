import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, POSTS_CACHE_CONTROL, SEARCH_DOCUMENTS_HEADER } from '../_routes';
import { GET_SEARCH_INDEX, isContentfulConfigured, queryContentful } from './_shared';

const PAGE_SIZE = 100;

/**
 * Every listed post, for the search index, without bodies. It reads the posts route's listing
 * (dated posts, newest first) a page of 100 at a time, until it has read them all.
 */
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

  try {
    const results: unknown[] = [];
    let total: number;
    do {
      const { blogPostCollection } = await queryContentful(GET_SEARCH_INDEX, {
        skip: results.length,
        limit: PAGE_SIZE,
        order: ['publishDate_DESC'],
        where: { publishDate_exists: true },
      });
      results.push(...blogPostCollection.items);
      total = blogPostCollection.total;
      // An empty page ends the read even if the total says otherwise, so it can never loop.
      if (blogPostCollection.items.length === 0) break;
    } while (results.length < total);

    response.setHeader('Cache-Control', POSTS_CACHE_CONTROL);
    response.setHeader(SEARCH_DOCUMENTS_HEADER, String(results.length));
    return response.status(200).json({ results });
  } catch (error) {
    console.error('Unable to fetch the Contentful search index', error);
    return response.status(502).json({ error: 'Unable to fetch the Contentful search index' });
  }
}
