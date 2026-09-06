import type { VercelRequest, VercelResponse } from '@vercel/node';
import { databaseId, getLimit, isNotionConfigured, notion } from './_shared';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<VercelResponse> {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  if (!isNotionConfigured()) {
    return response.status(500).json({ error: 'Notion is not configured' });
  }

  const limit = getLimit(request.query.limit);
  const category =
    typeof request.query.category === 'string'
      ? request.query.category
      : undefined;
  const publishedFilter = {
    property: 'Status',
    status: { equals: 'Published' },
  };
  const filter = category
    ? {
        and: [
          publishedFilter,
          {
            property: 'Category',
            select: { equals: category },
          },
        ],
      }
    : { and: [publishedFilter] };

  /*
   * The Notion SDK models each property filter as a discriminated union.
   * Building the complete filter first preserves that type information.
   */
  const queryFilter = filter;

  try {
    const pages = [];
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore && pages.length < limit) {
      const result = await notion.dataSources.query({
        data_source_id: databaseId!,
        page_size: limit - pages.length,
        start_cursor: cursor,
        sorts: [{ property: 'Date', direction: 'descending' }],
        filter: queryFilter,
      });

      pages.push(...result.results);
      hasMore = result.has_more;
      cursor = result.next_cursor || undefined;
    }

    response.setHeader(
      'Cache-Control',
      's-maxage=60, stale-while-revalidate=300',
    );

    return response.status(200).json({
      results: pages,
      hasMore,
    });
  } catch {
    return response.status(502).json({ error: 'Unable to fetch Notion posts' });
  }
}
