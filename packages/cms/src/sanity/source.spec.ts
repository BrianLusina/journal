import type { Mock } from 'vitest';
import { querySanity } from './client';
import { sanitySource } from './source';
import { POST_PROJECTION, SEARCH_PROJECTION } from './projection';
import { barePost, fullPost } from './__fixtures__';

vi.mock('./client', () => ({ querySanity: vi.fn() }));

const LISTED = '_type == "blogPost" && defined(slug.current) && defined(publishDate)';
const call = (index = 0) => (querySanity as Mock).mock.calls[index] as [string, Record<string, unknown>];

beforeEach(() => {
  (querySanity as Mock).mockReset();
});

describe('sanitySource.getPosts', () => {
  beforeEach(() => (querySanity as Mock).mockResolvedValue({ items: [fullPost, barePost], total: 5 }));

  it('reads one page of listed posts, newest first, with the offset of the next one', async () => {
    const page = await sanitySource.getPosts({ limit: 2 });

    const [query, params] = call();
    expect(query).toContain(`*[${LISTED}]`);
    expect(query).toContain('| order(publishDate desc)[$start...$end]');
    expect(query).toContain(POST_PROJECTION);
    expect(query).toContain('"total": count(');
    expect(params).toEqual({ start: 0, end: 2 });
    expect(page.items.map(post => post.id)).toEqual(['post-1', 'post-2']);
    expect(page.nextCursor).toBe('2');
  });

  it('starts at the cursor', async () => {
    await sanitySource.getPosts({ limit: 2, cursor: '2' });

    expect(call()[1]).toEqual({ start: 2, end: 4 });
  });

  it('has no next cursor once the page reaches the total', async () => {
    (querySanity as Mock).mockResolvedValue({ items: [fullPost], total: 3 });

    await expect(sanitySource.getPosts({ limit: 2, cursor: '2' })).resolves.toMatchObject({ nextCursor: null });
  });

  it('filters by category and by tag name as parameters, never in the query text', async () => {
    const tag = 'a" || true || "';
    await sanitySource.getPosts({ limit: 2, category: 'Engineering', tag });

    const [query, params] = call();
    expect(query).toContain('category == $category');
    expect(query).toContain('$tag in tags[]->name');
    expect(query).not.toContain(tag);
    expect(query).not.toContain('Engineering');
    expect(params).toMatchObject({ category: 'Engineering', tag });
  });

  it.each(['x', '-1', '1.5'])('rejects the cursor %s without querying', async cursor => {
    await expect(sanitySource.getPosts({ limit: 2, cursor })).rejects.toThrow('Invalid cursor');
    expect(querySanity).not.toHaveBeenCalled();
  });
});

describe('sanitySource.getPostBySlug', () => {
  it('reads the listed post with that slug, body included', async () => {
    (querySanity as Mock).mockResolvedValue(fullPost);

    const post = await sanitySource.getPostBySlug('hello-sanity');

    const [query, params] = call();
    expect(query).toContain(`*[${LISTED} && slug.current == $slug][0]`);
    expect(query).toContain(POST_PROJECTION);
    expect(params).toEqual({ slug: 'hello-sanity' });
    expect(post).toMatchObject({ id: 'post-1', body: expect.stringContaining('## Why') });
  });

  it('answers null when there is no such post', async () => {
    (querySanity as Mock).mockResolvedValue(null);

    await expect(sanitySource.getPostBySlug('missing')).resolves.toBeNull();
  });
});

describe('sanitySource.getSearchIndex', () => {
  it('reads every listed post without bodies', async () => {
    const { body: _body, heroImage: _hero, ...searchPost } = fullPost;
    (querySanity as Mock).mockResolvedValue([searchPost]);

    const posts = await sanitySource.getSearchIndex();

    const [query] = call();
    expect(query).toContain(`*[${LISTED}] | order(publishDate desc)`);
    expect(query).toContain(SEARCH_PROJECTION);
    expect(query).not.toContain('$start');
    expect(posts).toHaveLength(1);
    expect(posts[0]).not.toHaveProperty('body');
  });
});

it('never chooses its own perspective: querySanity always reads published content', async () => {
  (querySanity as Mock).mockResolvedValue({ items: [], total: 0 });
  await sanitySource.getPosts({ limit: 1 });
  (querySanity as Mock).mockResolvedValue(null);
  await sanitySource.getPostBySlug('x');
  (querySanity as Mock).mockResolvedValue([]);
  await sanitySource.getSearchIndex();

  for (const [, params] of (querySanity as Mock).mock.calls) {
    expect(params).not.toHaveProperty('perspective');
  }
});
