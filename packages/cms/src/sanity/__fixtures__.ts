import type { SanityPost } from './projection';

/**
 * Posts in the shape POST_PROJECTION answers. Hand-written: the datasets held no published post when
 * the adapter was written; replace with a recorded response once one exists.
 */
export const fullPost: SanityPost = {
  _id: 'post-1',
  title: 'Hello Sanity',
  slug: 'hello-sanity',
  subtitle: 'A third source',
  description: 'How the journal reads Sanity.',
  category: 'Engineering',
  publishDate: '2026-11-20T09:00:00.000Z',
  tags: ['CMS', 'GROQ'],
  authors: [{ _id: 'author-1', name: 'Brian', shortBio: 'Writes code.', avatarUrl: 'https://cdn.sanity.io/images/p/d/avatar.png' }],
  heroImage: { alt: 'A tree', url: 'https://cdn.sanity.io/images/p/d/hero.png' },
  thumbnail: { alt: 'A small tree', url: 'https://cdn.sanity.io/images/p/d/thumb.png' },
  body: [
    {
      _type: 'block',
      _key: 'b1',
      style: 'h2',
      markDefs: [],
      children: [{ _type: 'span', _key: 's1', text: 'Why', marks: [] }],
    },
    {
      _type: 'block',
      _key: 'b2',
      style: 'normal',
      markDefs: [{ _type: 'link', _key: 'l1', href: 'https://www.sanity.io' }],
      children: [
        { _type: 'span', _key: 's2', text: 'Read ', marks: [] },
        { _type: 'span', _key: 's3', text: 'the docs', marks: ['l1'] },
        { _type: 'span', _key: 's4', text: ', ', marks: [] },
        { _type: 'span', _key: 's5', text: 'carefully', marks: ['strong'] },
      ],
    },
    { _type: 'code', _key: 'c1', code: 'const a = 1', language: 'ts' },
    { _type: 'image', _key: 'i1', alt: 'Diagram', url: 'https://cdn.sanity.io/images/p/d/x.png' },
  ],
};

/** The least a listed post can have: everything optional left out or null. */
export const barePost: SanityPost = {
  _id: 'post-2',
  title: 'Bare',
  slug: 'bare',
  publishDate: '2026-11-19T09:00:00.000Z',
  subtitle: null,
  description: null,
  category: null,
  tags: null,
  authors: null,
  heroImage: null,
  thumbnail: null,
  body: null,
};
