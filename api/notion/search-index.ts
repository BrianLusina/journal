import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, SEARCH_DOCUMENTS_HEADER, POSTS_CACHE_CONTROL } from '../_routes';
import { listedFilters, NOTION_PROPERTY } from './_schema';
import { getDataSourceId, isNotionConfigured, notion } from './_shared';

/**
 * Every listed post, for the search index. A query returns page properties only, never the body,
 * so the listing query is already as slim as the index needs. It reads one Notion page of up to 100
 * posts per request, until Notion has no more.
 */
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
    const dataSourceId = await getDataSourceId();
    const results: unknown[] = [];
    let cursor: string | undefined;
    do {
      const page = await notion.dataSources.query({
        data_source_id: dataSourceId,
        page_size: 100,
        start_cursor: cursor,
        sorts: [{ property: NOTION_PROPERTY.published, direction: 'descending' }],
        filter: { and: listedFilters },
      });
      results.push(...page.results);
      cursor = page.has_more ? page.next_cursor ?? undefined : undefined;
    } while (cursor);

    response.setHeader('Cache-Control', POSTS_CACHE_CONTROL);
    response.setHeader(SEARCH_DOCUMENTS_HEADER, String(results.length));
    return response.status(200).json({ results });
  } catch (error) {
    console.error('Unable to fetch the Notion search index', error);
    return response.status(502).json({ error: 'Unable to fetch the Notion search index' });
  }
}
