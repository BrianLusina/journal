import CMSAdapter from './CMSAdapter';

/**
 * Maps a Contentful BlogPostItem (as returned by the api/contentful routes) to the generic
 * UnifiedPost domain model.
 */
function mapContentfulPostToUnified(post: BlogPostItem): UnifiedPost {
  return {
    id: post.sys.id,
    source: 'contentful',
    title: post.title,
    subtitle: post.subtitle,
    description: post.description,
    category: post.category,
    slug: post.slug,
    body: post.body,
    publishDate: post.publishDate || post.sys.firstPublishedAt,
    heroImage: post.heroImage ? {
      url: post.heroImage.url,
      description: post.heroImage.description,
      title: post.heroImage.title,
    } : undefined,
    thumbnail: post.thumbnail ? {
      url: post.thumbnail.url,
      description: post.thumbnail.description,
      title: post.thumbnail.title,
    } : undefined,
    // Older posts keep their tags in the legacy `tags` field rather than in Contentful tags.
    tags: [...new Set([...(post.contentfulMetadata?.tags?.map(tag => tag.name) ?? []), ...(post.tags ?? [])])],
    authors: post.authorsCollection?.items?.map(author => ({
      id: author.sys.id,
      source: 'contentful' as const,
      name: author.name,
      avatarUrl: author.image?.url,
      shortBio: author.shortBio,
    })) || [],
  };
}

export default class ContentfulAdapter implements CMSAdapter {
  public readonly source: CMSSource = 'contentful';

  async getPosts({ cursor, limit, category, tag }: CMSPageRequest): Promise<CMSPage> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (category) params.set('category', category);
    if (tag) params.set('tag', tag);
    if (cursor) params.set('cursor', cursor);
    const response = await fetch(`/api/contentful/posts?${params}`);

    if (!response.ok) {
      throw new Error(`Unable to fetch Contentful posts: ${response.status}`);
    }

    const payload = await response.json();

    return {
      items: payload.results.map(mapContentfulPostToUnified),
      nextCursor: payload.nextCursor,
    };
  }

  async getPostBySlug(slug: string): Promise<UnifiedPost | null> {
    const response = await fetch(`/api/contentful/posts/${encodeURIComponent(slug)}`);
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`Unable to fetch Contentful post: ${response.status}`);
    }

    const payload = await response.json();

    return mapContentfulPostToUnified(payload.post);
  }
}
