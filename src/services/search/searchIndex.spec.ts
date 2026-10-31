import type CMSAdapter from '@/services/cms/CMSAdapter';
import { loadSearchIndex } from './searchIndex';

const post = (id: string, source: CMSSource, fields: Partial<UnifiedPost> = {}): UnifiedPost => ({
  id,
  source,
  title: id,
  slug: `${id}-slug`,
  publishDate: '2024-01-01',
  tags: [],
  authors: [],
  ...fields,
});

const adapter = (source: CMSSource, getSearchIndex: jest.Mock): CMSAdapter => ({
  source,
  getPosts: jest.fn(),
  getPostBySlug: jest.fn(),
  getSearchIndex,
});

describe('loadSearchIndex', () => {
  it('turns the posts of every source into search documents', async () => {
    const contentful = adapter(
      'contentful',
      jest.fn().mockResolvedValue([
        post('c1', 'contentful', {
          subtitle: 'Sub',
          description: 'Desc',
          category: 'Tech',
          tags: ['React'],
          authors: [{ id: 'a1', source: 'contentful', name: 'Ada' }, { id: 'a2', source: 'contentful' }],
          thumbnail: { url: 'https://images/c1.png' },
        }),
      ]),
    );
    const notion = adapter('notion', jest.fn().mockResolvedValue([post('n1', 'notion')]));

    const { documents, errors } = await loadSearchIndex([contentful, notion]);

    expect(errors).toEqual([]);
    expect(documents).toEqual([
      {
        key: 'contentful:c1',
        id: 'c1',
        source: 'contentful',
        slug: 'c1-slug',
        title: 'c1',
        subtitle: 'Sub',
        description: 'Desc',
        category: 'Tech',
        tags: ['React'],
        authors: ['Ada'],
        publishDate: '2024-01-01',
        thumbnailUrl: 'https://images/c1.png',
      },
      expect.objectContaining({ key: 'notion:n1', source: 'notion', authors: [], thumbnailUrl: undefined }),
    ]);
  });

  it('keeps one document per post when a source returns a post twice', async () => {
    const contentful = adapter('contentful', jest.fn().mockResolvedValue([post('c1', 'contentful'), post('c1', 'contentful')]));
    const notion = adapter('notion', jest.fn().mockResolvedValue([post('c1', 'notion')]));

    const { documents } = await loadSearchIndex([contentful, notion]);

    expect(documents.map(document => document.key)).toEqual(['contentful:c1', 'notion:c1']);
  });

  it('keeps the other sources and returns the error when one source fails', async () => {
    const failure = new Error('Unable to fetch the Notion search index: 502');
    const contentful = adapter('contentful', jest.fn().mockResolvedValue([post('c1', 'contentful')]));
    const notion = adapter('notion', jest.fn().mockRejectedValue(failure));

    const { documents, errors } = await loadSearchIndex([contentful, notion]);

    expect(documents.map(document => document.key)).toEqual(['contentful:c1']);
    expect(errors).toEqual([failure]);
  });

  it('rejects when every source fails', async () => {
    const failure = new Error('down');
    const contentful = adapter('contentful', jest.fn().mockRejectedValue(failure));
    const notion = adapter('notion', jest.fn().mockRejectedValue(new Error('also down')));

    await expect(loadSearchIndex([contentful, notion])).rejects.toBe(failure);
  });

  it('asks only the sources it is given', async () => {
    const contentful = adapter('contentful', jest.fn().mockResolvedValue([]));

    await loadSearchIndex([contentful]);

    expect(contentful.getSearchIndex).toHaveBeenCalledTimes(1);
  });
});
