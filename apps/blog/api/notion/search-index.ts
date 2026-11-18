import type { VercelRequest, VercelResponse } from '@vercel/node';
import { notionSource, isNotionConfigured } from '@brianlusina/cms/server';
import { methodNotAllowed, POSTS_CACHE_CONTROL, SEARCH_DOCUMENTS_HEADER } from '../_routes';

/** Every listed post, for the search index, without bodies. */
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

  try {
    const results = await notionSource.getSearchIndex();

    response.setHeader('Cache-Control', POSTS_CACHE_CONTROL);
    response.setHeader(SEARCH_DOCUMENTS_HEADER, String(results.length));
    return response.status(200).json({ results });
  } catch (error) {
    console.error('Unable to fetch the Notion search index', error);
    return response.status(502).json({ error: 'Unable to fetch the Notion search index' });
  }
}
