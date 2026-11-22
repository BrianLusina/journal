import { portableTextToMarkdown } from '@portabletext/markdown';
import type { UnifiedAsset, UnifiedAuthor, UnifiedPost } from '../types';
import type { SanityBodyNode, SanityPost } from './projection';

/** Copies only the keys whose value is set, so a missing Sanity field is an absent key, not null. */
function defined<T extends Record<string, unknown>>(values: T): Partial<{ [K in keyof T]: NonNullable<T[K]> }> {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== null && value !== undefined)) as Partial<{
    [K in keyof T]: NonNullable<T[K]>;
  }>;
}

function asset(image: SanityPost['heroImage']): UnifiedAsset | undefined {
  return image?.url ? { url: image.url, ...defined({ description: image.alt }) } : undefined;
}

/** Code blocks (@sanity/code-input) and image blocks have no Markdown form of their own. */
const renderers = {
  types: {
    code: ({ value }: { value: SanityBodyNode }) => `\`\`\`${(value.language as string | undefined) ?? ''}\n${value.code ?? ''}\n\`\`\``,
    image: ({ value }: { value: SanityBodyNode }) => (value.url ? `![${(value.alt as string | undefined) ?? ''}](${value.url})` : ''),
  },
};

function markdown(body: SanityPost['body']): string | undefined {
  if (!body?.length) return undefined;
  return portableTextToMarkdown(body, renderers);
}

/** A Sanity blogPost, as the projections answer it, as a unified post. */
export function mapSanityPost(post: SanityPost): UnifiedPost {
  const authors: UnifiedAuthor[] = (post.authors ?? [])
    .filter(author => author !== null)
    .map(author => ({
      id: author._id,
      source: 'sanity',
      ...defined({ name: author.name, shortBio: author.shortBio, avatarUrl: author.avatarUrl }),
    }));

  return {
    id: post._id,
    source: 'sanity',
    title: post.title,
    slug: post.slug,
    publishDate: post.publishDate,
    ...defined({
      subtitle: post.subtitle,
      description: post.description,
      category: post.category,
      heroImage: asset(post.heroImage),
      thumbnail: asset(post.thumbnail),
      body: markdown(post.body),
    }),
    tags: (post.tags ?? []).filter((tag): tag is string => typeof tag === 'string'),
    authors,
  };
}
