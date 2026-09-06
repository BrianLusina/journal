import client from '@graphQlClient';
import { GET_ALL_BLOGS, GET_BLOG } from '@graphQl/queries';
import { CMSAdapter } from './CMSAdapter';

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
      name: author.name,
      avatarUrl: author.image?.url,
    })) || [],
  };
}

export class ContentfulAdapter implements CMSAdapter {
  public readonly source: CMSSource = 'contentful';

  async getPosts(options?: CMSPaginationOptions): Promise<PaginatedUnifiedPosts> {
    const query = GET_ALL_BLOGS;
    
    const skip = options?.skip || 0;
    const limit = options?.limit || 100;
    const variables: GetAllBlogsVariables = {
        skip,
        limit,
    };
    
    if (options?.category) {
        variables.where = { category: options.category };
    }

    const { data } = await client.query<BlogPostsData, GetAllBlogsVariables>({
      query,
      variables,
      fetchPolicy: 'network-only', // or cache-first if preferred
    });

    const collection = data.blogPostCollection;
    return {
      items: collection.items.map(mapContentfulPostToUnified),
      total: collection.total,
      limit: collection.limit,
      skip,
      hasMore: collection.total > skip + collection.items.length,
    };
  }

  async getPostBySlug(slug: string): Promise<UnifiedPost | null> {
    const { data } = await client.query<BlogPostsData, GetAllBlogsVariables>({
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
