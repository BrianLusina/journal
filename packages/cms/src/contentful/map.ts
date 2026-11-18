import type { UnifiedPost } from '../types';

type ContentfulAsset = { url: string; description?: string; title?: string };

/** A Contentful blog post as GET_BLOG_POSTS and GET_SEARCH_INDEX select it (client.ts). */
export type ContentfulPostItem = {
  sys: { id: string; firstPublishedAt: string };
  title: string;
  subtitle?: string;
  description?: string;
  category?: string;
  slug: string;
  body?: string;
  publishDate?: string | null;
  tags?: string[] | null;
  heroImage?: ContentfulAsset | null;
  thumbnail?: ContentfulAsset | null;
  contentfulMetadata?: { tags?: { id: string; name: string }[] } | null;
  authorsCollection?: {
    items?: { sys: { id: string }; name?: string; shortBio?: string; image?: { url: string } | null }[];
  } | null;
};

const asset = (value: ContentfulAsset | null | undefined) =>
  value ? { url: value.url, description: value.description, title: value.title } : undefined;

/** Maps a Contentful blog post onto the unified post model. */
export function mapContentfulPost(post: ContentfulPostItem): UnifiedPost {
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
    heroImage: asset(post.heroImage),
    thumbnail: asset(post.thumbnail),
    // Older posts keep their tags in the legacy `tags` field rather than in Contentful tags.
    tags: [...new Set([...(post.contentfulMetadata?.tags?.map(tag => tag.name) ?? []), ...(post.tags ?? [])])],
    authors:
      post.authorsCollection?.items?.map(author => ({
        id: author.sys.id,
        source: 'contentful' as const,
        name: author.name,
        avatarUrl: author.image?.url,
        shortBio: author.shortBio,
      })) || [],
  };
}
