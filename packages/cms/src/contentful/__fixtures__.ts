import type { ContentfulPostItem } from './map';

/** A Contentful blog post as the GraphQL API returns it, for specs. */
export const contentfulPost = (overrides: Partial<Record<keyof ContentfulPostItem, unknown>> = {}) =>
  ({
    sys: { id: 'post-1', firstPublishedAt: '2024-01-02T10:00:00.000Z' },
    title: 'Title',
    subtitle: 'Subtitle',
    description: 'Description',
    category: 'Wellness',
    slug: 'title',
    body: '# Body',
    publishDate: '2024-01-01T10:00:00.000Z',
    heroImage: { url: 'https://images/hero.png', description: 'Hero', title: 'Hero title' },
    thumbnail: { url: 'https://images/thumb.png', description: 'Thumb', title: 'Thumb title' },
    contentfulMetadata: { tags: [{ id: 'mindfulness', name: 'Mindfulness' }] },
    authorsCollection: {
      items: [{ sys: { id: 'author-1' }, name: 'Ada', shortBio: 'Writes.', image: { url: 'https://images/ada.png' } }],
    },
    ...overrides,
  }) as ContentfulPostItem;
