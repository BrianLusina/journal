import type { VercelRequest, VercelResponse } from '@vercel/node';
import { NotionToMarkdown } from 'notion-to-md';
import { databaseId, isNotionConfigured, notion } from '../_shared';

const markdown = new NotionToMarkdown({ notionClient: notion });

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<VercelResponse> {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  if (!isNotionConfigured() || typeof request.query.slug !== 'string') {
    return response.status(400).json({ error: 'Invalid request' });
  }

  try {
    const result = await notion.dataSources.query({
      data_source_id: databaseId!,
      page_size: 1,
      filter: {
        and: [
          { property: 'Slug', rich_text: { equals: request.query.slug } },
          { property: 'Status', status: { equals: 'Published' } },
        ],
      },
    });

    if (result.results.length === 0) {
      return response.status(404).json({ error: 'Post not found' });
    }

    const page = result.results[0];
    const blocks = await markdown.pageToMarkdown(page.id);
    const body = markdown.toMarkdownString(blocks).parent;

    response.setHeader(
      'Cache-Control',
      's-maxage=60, stale-while-revalidate=300',
    );

    return response.status(200).json({ page, body });
  } catch {
    return response.status(502).json({ error: 'Unable to fetch Notion post' });
  }
}
