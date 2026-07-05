import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { CMSAdapter } from './CMSAdapter';

const notion = new Client({
  auth: import.meta.env.VITE_NOTION_API_KEY,
});
const n2m = new NotionToMarkdown({ notionClient: notion });
const databaseId = import.meta.env.VITE_NOTION_DATABASE_ID;

/**
 * Maps a Notion Page object to the UnifiedPost domain model.
 */
function mapNotionPageToUnified(page: any): UnifiedPost {
  const properties = page.properties;

  // Extract standard properties gracefully
  const title = properties.Title?.title?.[0]?.plain_text || 'Untitled';
  const slug = properties.Slug?.rich_text?.[0]?.plain_text || page.id;
  const description = properties.Description?.rich_text?.[0]?.plain_text;
  const category = properties.Category?.select?.name;
  const publishDate = properties.Date?.date?.start || page.created_time;
  
  // Tags
  const tags = properties.Tags?.multi_select?.map((tag: any) => tag.name) || [];

  // Authors (assuming people property or relation)
  const authors: UnifiedAuthor[] = [];
  if (properties.Author?.people) {
    authors.push(
      ...properties.Author.people.map((person: any) => ({
        id: person.id,
        name: person.name,
        avatarUrl: person.avatar_url,
      }))
    );
  } else if (properties.Author?.rich_text) {
     authors.push({
         id: 'notion-author',
         name: properties.Author.rich_text[0]?.plain_text
     });
  }

  // Cover image
  let heroImage: UnifiedAsset | undefined;
  if (page.cover) {
    const url = page.cover.type === 'external' ? page.cover.external.url : page.cover.file?.url;
    if (url) {
      heroImage = { url, title: 'Cover Image' };
    }
  }

  return {
    id: page.id,
    source: 'notion',
    title,
    slug,
    description,
    category,
    publishDate,
    heroImage,
    thumbnail: heroImage, // fallback thumbnail to heroImage
    tags,
    authors,
  };
}

export class NotionAdapter implements CMSAdapter {
  public readonly source: CMSSource = 'notion';

  async getPosts(options?: CMSPaginationOptions): Promise<PaginatedUnifiedPosts> {
    if (!databaseId) {
      return { items: [], total: 0, limit: options?.limit || 100, skip: options?.skip || 0 };
    }

    // For simplistic pagination, Notion uses start_cursor. 
    // Implementing strict offset/limit requires cursors. 
    // Here we map limit to page_size, ignoring skip for a basic implementation.
    const filter: any = {
      and: [
        {
          property: 'Status',
          status: {
            equals: 'Published',
          },
        }
      ]
    };

    if (options?.category) {
      filter.and.push({
        property: 'Category',
        select: {
          equals: options.category,
        },
      });
    }

    const response = await notion.databases.query({
      database_id: databaseId,
      page_size: options?.limit || 100,
      sorts: [
        {
          property: 'Date',
          direction: 'descending',
        },
      ],
      filter,
    });

    return {
      items: response.results.map(mapNotionPageToUnified),
      total: response.results.length, // Notion doesn't return total count without paginating everything
      limit: options?.limit || 100,
      skip: options?.skip || 0,
    };
  }

  async getPostBySlug(slug: string): Promise<UnifiedPost | null> {
    if (!databaseId) return null;

    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Slug',
        rich_text: {
          equals: slug,
        },
      },
      page_size: 1,
    });

    if (response.results.length === 0) return null;

    const page = response.results[0];
    const post = mapNotionPageToUnified(page);

    // Fetch the markdown body
    const mdBlocks = await n2m.pageToMarkdown(page.id);
    const mdString = n2m.toMarkdownString(mdBlocks);
    post.body = mdString.parent;

    return post;
  }
}
