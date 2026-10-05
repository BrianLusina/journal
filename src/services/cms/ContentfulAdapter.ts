import contentfulClient, { GET_ALL_BLOGS, GET_BLOG } from '@contentfulClient';
import CMSAdapter from './CMSAdapter';

/**
 * Maps the raw Contentful BlogPostItem to the generic UnifiedPost domain model.
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
    tags: post.contentfulMetadata?.tags?.map(tag => tag.name) || [],
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
    const query = GET_ALL_BLOGS;

    // The cursor is the offset of the next post. The merged feed orders every source by publish
    // date, newest first, so a post without one has no place in it.
    const skip = cursor ? Number(cursor) : 0;
    const variables: GetAllBlogsVariables = {
      skip,
      limit,
      order: ['publishDate_DESC'],
      where: {
        publishDate_exists: true,
        ...(category ? { category } : {}),
        // A tag's slug is camelCase(name), which is also the ID Contentful gives a new tag.
        ...(tag ? { contentfulMetadata: { tags: { id_contains_some: [tag] } } } : {}),
      },
    };

    const { data } = await contentfulClient.query<BlogPostsData, GetAllBlogsVariables>({
      query,
      variables,
      fetchPolicy: 'network-only', // or cache-first if preferred
    });

    const collection = data.blogPostCollection;
    const next = skip + collection.items.length;
    return {
      items: collection.items.map(mapContentfulPostToUnified),
      nextCursor: next < collection.total ? String(next) : null,
    };
  }

  async getPostBySlug(slug: string): Promise<UnifiedPost | null> {
    const { data } = await contentfulClient.query<BlogPostsData, GetAllBlogsVariables>({
      query: GET_ALL_BLOGS,
      variables: {
        limit: 1,
        where: { slug },
      },
    });

    const items = data.blogPostCollection.items;
    if (!items || items.length === 0) return null;

    return mapContentfulPostToUnified(items[0]);
  }
}
