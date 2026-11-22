import { barePost, fullPost } from './__fixtures__';
import { mapSanityPost } from './map';

describe('mapSanityPost', () => {
  it('maps a post onto the unified model', () => {
    const { body, ...post } = mapSanityPost(fullPost);

    expect(post).toEqual({
      id: 'post-1',
      source: 'sanity',
      title: 'Hello Sanity',
      slug: 'hello-sanity',
      subtitle: 'A third source',
      description: 'How the journal reads Sanity.',
      category: 'Engineering',
      publishDate: '2026-11-20T09:00:00.000Z',
      tags: ['CMS', 'GROQ'],
      authors: [
        { id: 'author-1', source: 'sanity', name: 'Brian', shortBio: 'Writes code.', avatarUrl: 'https://cdn.sanity.io/images/p/d/avatar.png' },
      ],
      heroImage: { url: 'https://cdn.sanity.io/images/p/d/hero.png', description: 'A tree' },
      thumbnail: { url: 'https://cdn.sanity.io/images/p/d/thumb.png', description: 'A small tree' },
    });
    expect(body).toEqual(expect.any(String));
  });

  it('leaves missing optional fields out instead of setting them to null', () => {
    expect(mapSanityPost(barePost)).toEqual({
      id: 'post-2',
      source: 'sanity',
      title: 'Bare',
      slug: 'bare',
      publishDate: '2026-11-19T09:00:00.000Z',
      tags: [],
      authors: [],
    });
  });

  it('drops a tag whose reference is broken', () => {
    expect(mapSanityPost({ ...barePost, tags: ['CMS', null] }).tags).toEqual(['CMS']);
  });

  it('drops an author whose reference is broken', () => {
    expect(mapSanityPost({ ...barePost, authors: [null] }).authors).toEqual([]);
  });

  describe('the body, as Markdown', () => {
    const body = mapSanityPost(fullPost).body!;

    it('keeps headings, links and emphasis', () => {
      expect(body).toContain('## Why');
      expect(body).toContain('[the docs](https://www.sanity.io)');
      expect(body).toContain('**carefully**');
    });

    it('fences code blocks with their language', () => {
      expect(body).toContain('```ts\nconst a = 1\n```');
    });

    it('renders image blocks from their resolved URL', () => {
      expect(body).toContain('![Diagram](https://cdn.sanity.io/images/p/d/x.png)');
    });

    it('is left out when the post has none', () => {
      expect(mapSanityPost({ ...barePost, body: [] })).not.toHaveProperty('body');
      expect(mapSanityPost(barePost)).not.toHaveProperty('body');
    });

    it('survives a block type it does not know', () => {
      expect(() => mapSanityPost({ ...barePost, body: [{ _type: 'chart', _key: 'x1', title: 'Q3' }] })).not.toThrow();
    });
  });

  it('maps a search-index post, which has no body', () => {
    const { body: _body, heroImage: _hero, ...searchPost } = fullPost;

    expect(mapSanityPost(searchPost)).not.toHaveProperty('body');
  });
});
