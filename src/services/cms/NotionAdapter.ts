import CMSAdapter from './CMSAdapter';

type NotionText = { plain_text?: string }[];

/**
 * The subset of a Notion page object (as returned by the api/notion routes) that the adapter
 * reads. Property names match the columns of the Notion posts database.
 */
type NotionPage = {
  id: string;
  created_time: string;
  cover?: { type: 'external' | 'file'; external?: { url: string }; file?: { url: string } } | null;
  properties: {
    Title?: { title?: NotionText };
    Slug?: { rich_text?: NotionText };
    Description?: { rich_text?: NotionText };
    Category?: { select?: { name: string } | null };
    Date?: { date?: { start: string } | null };
    Tags?: { multi_select?: { name: string }[] };
    Author?: { people?: { id: string; name?: string; avatar_url?: string }[]; rich_text?: NotionText };
  };
};

/**
 * Maps a Notion Page object to the UnifiedPost domain model.
 */
function mapNotionPageToUnified(page: NotionPage): UnifiedPost {
  const properties = page.properties;

  // Extract standard properties gracefully
  const title = properties.Title?.title?.[0]?.plain_text || 'Untitled';
  // The posts routes only return pages with a Slug, and the slug route matches the whole Slug
  // text, so join every segment rather than taking the first.
  const slug = (properties.Slug?.rich_text ?? []).map(text => text.plain_text).join('');
  const description = properties.Description?.rich_text?.[0]?.plain_text;
  const category = properties.Category?.select?.name;
  const publishDate = properties.Date?.date?.start || page.created_time;
  
  // Tags
  const tags = properties.Tags?.multi_select?.map(tag => tag.name) || [];

  // Authors (assuming people property or relation)
  const authors: UnifiedAuthor[] = [];
  if (properties.Author?.people) {
    authors.push(
      ...properties.Author.people.map(person => ({
        id: person.id,
        source: 'notion' as const,
        name: person.name,
        avatarUrl: person.avatar_url,
      }))
    );
  } else if (properties.Author?.rich_text) {
     authors.push({
         id: 'notion-author',
         source: 'notion',
         // A name can span several rich-text segments (e.g. partly bold), so join them all.
         name: properties.Author.rich_text.map(text => text.plain_text).join('')
     });
  }

  // Cover image
  let heroImage: UnifiedAsset | undefined;
  if (page.cover) {
    const url = page.cover.type === 'external' ? page.cover.external?.url : page.cover.file?.url;
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

export default class NotionAdapter implements CMSAdapter {
  public readonly source: CMSSource = 'notion';

  async getPosts(options?: CMSPaginationOptions): Promise<PaginatedUnifiedPosts> {
    const skip = options?.skip || 0;
    const limit = options?.limit || 100;
    const params = new URLSearchParams({ limit: String(skip + limit) });
    if (options?.category) params.set('category', options.category);
    const response = await fetch(`/api/notion/posts?${params}`);

    if (!response.ok) {
      throw new Error(`Unable to fetch Notion posts: ${response.status}`);
    }

    const payload = await response.json();

    return {
      items: payload.results
        .slice(skip, skip + limit)
        .map(mapNotionPageToUnified),
      total: payload.results.length,
      limit,
      skip,
      hasMore: payload.hasMore,
    };
  }

  async getPostBySlug(slug: string): Promise<UnifiedPost | null> {
    const response = await fetch(`/api/notion/posts/${encodeURIComponent(slug)}`);
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`Unable to fetch Notion post: ${response.status}`);
    }

    const payload = await response.json();
    const page = payload.page;
    const post = mapNotionPageToUnified(page);
    post.body = payload.body;

    return post;
  }
}
