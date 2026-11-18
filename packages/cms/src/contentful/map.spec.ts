import { contentfulPost } from './__fixtures__';
import { mapContentfulPost } from './map';

describe('mapContentfulPost', () => {
  it('maps a Contentful blog post onto the unified post model', () => {
    expect(mapContentfulPost(contentfulPost())).toEqual({
      id: 'post-1',
      source: 'contentful',
      title: 'Title',
      subtitle: 'Subtitle',
      description: 'Description',
      category: 'Wellness',
      slug: 'title',
      body: '# Body',
      publishDate: '2024-01-01T10:00:00.000Z',
      heroImage: { url: 'https://images/hero.png', description: 'Hero', title: 'Hero title' },
      thumbnail: { url: 'https://images/thumb.png', description: 'Thumb', title: 'Thumb title' },
      tags: ['Mindfulness'],
      authors: [{ id: 'author-1', source: 'contentful', name: 'Ada', avatarUrl: 'https://images/ada.png', shortBio: 'Writes.' }],
    });
  });

  it('falls back to the first published date and tolerates missing images, tags and authors', () => {
    const post = mapContentfulPost(
      contentfulPost({ publishDate: null, heroImage: null, thumbnail: null, contentfulMetadata: null, authorsCollection: null }),
    );

    expect(post).toMatchObject({
      publishDate: '2024-01-02T10:00:00.000Z',
      heroImage: undefined,
      thumbnail: undefined,
      tags: [],
      authors: [],
    });
  });

  it('shows the tags from both the Contentful tags and the legacy tags field, once each', () => {
    expect(mapContentfulPost(contentfulPost({ tags: ['Mindfulness', 'Travel'] })).tags).toEqual(['Mindfulness', 'Travel']);
  });
});
