import type { VercelRequest, VercelResponse } from '@vercel/node';
import camelCase from 'lodash/camelCase';
import { getDataSourceId, getLimit, isNotionConfigured, notion } from './_shared';

/**
 * The Tags options whose slug is `tag`. Tag links use camelCase(name) as the slug, but Notion only
 * filters a multi-select by an option's exact name, so the slug is matched against the schema.
 */
async function tagOptionNames(dataSourceId: string, tag: string): Promise<string[]> {
  const dataSource = await notion.dataSources.retrieve({ data_source_id: dataSourceId });
  const tags = dataSource.properties.Tags;
  if (tags?.type !== 'multi_select') return [];

  return tags.multi_select.options.map(option => option.name).filter(name => camelCase(name) === tag);
}

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
  const cursor =
    typeof request.query.cursor === 'string' && request.query.cursor
      ? request.query.cursor
      : undefined;
  const category =
    typeof request.query.category === 'string'
      ? request.query.category
      : undefined;
  const tag =
    typeof request.query.tag === 'string' && request.query.tag
      ? request.query.tag
      : undefined;
  const publishedFilter = {
    property: 'Status',
    status: { equals: 'Published' },
  };
  // A post without a slug cannot be opened: the slug route looks posts up by Slug.
  const hasSlugFilter = {
    property: 'Slug',
    rich_text: { is_not_empty: true as const },
  };
  // The merged feed orders every source by publish date, so a post without one has no place in it.
  const hasDateFilter = {
    property: 'Date',
    date: { is_not_empty: true as const },
  };
  const listedFilters = [publishedFilter, hasSlugFilter, hasDateFilter];
  const categoryFilters = category
    ? [
        {
          property: 'Category',
          select: { equals: category },
        },
      ]
    : [];

  try {
    const dataSourceId = await getDataSourceId();
    const tagNames = tag ? await tagOptionNames(dataSourceId, tag) : [];
    if (tag && tagNames.length === 0) {
      response.setHeader(
        'Cache-Control',
        's-maxage=60, stale-while-revalidate=300',
      );
      return response.status(200).json({ results: [], nextCursor: null });
    }
    const tagFilters = tag
      ? [{ or: tagNames.map(name => ({ property: 'Tags', multi_select: { contains: name } })) }]
      : [];

    /*
     * The Notion SDK models each property filter as a discriminated union.
     * Building the complete filter first preserves that type information.
     */
    const queryFilter = { and: [...listedFilters, ...categoryFilters, ...tagFilters] };

    // One page per request: the client follows nextCursor, so no request reads from the start.
    const result = await notion.dataSources.query({
      data_source_id: dataSourceId,
      page_size: limit,
      start_cursor: cursor,
      sorts: [{ property: 'Date', direction: 'descending' }],
      filter: queryFilter,
    });

    response.setHeader(
      'Cache-Control',
      's-maxage=60, stale-while-revalidate=300',
    );

    return response.status(200).json({
      results: result.results,
      nextCursor: result.has_more ? result.next_cursor : null,
    });
  } catch {
    return response.status(502).json({ error: 'Unable to fetch Notion posts' });
  }
}
