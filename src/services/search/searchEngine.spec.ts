import { createSearchEngine } from './searchEngine';
import type { SearchDocument } from './SearchDocument';

const doc = (id: string, fields: Partial<SearchDocument> = {}): SearchDocument => ({
  key: `contentful:${id}`,
  id,
  source: 'contentful',
  slug: id,
  title: id,
  tags: [],
  authors: [],
  publishDate: '2024-01-01',
  ...fields,
});

const keys = (results: SearchDocument[]) => results.map(result => result.id);

describe('createSearchEngine', () => {
  const engine = createSearchEngine([
    doc('hooks', { title: 'Understanding React Hooks', description: 'State and effects' }),
    doc('tagged', { title: 'A week of notes', tags: ['React'] }),
    doc('described', { title: 'Frontend frameworks', description: 'Why I keep choosing React' }),
    doc('travel', { title: 'Kyoto in Autumn', category: 'Travel', authors: ['Ada Lovelace'], subtitle: 'Temples' }),
    doc('n1', { key: 'notion:n1', source: 'notion', title: 'Kubernetes Operators' }),
  ]);

  it('ranks a title match over a tag match over a description match', () => {
    expect(keys(engine.search('react'))).toEqual(['hooks', 'tagged', 'described']);
  });

  it.each([
    ['the title', 'kyoto'],
    ['the subtitle', 'temples'],
    ['the category', 'travel'],
    ['an author name', 'lovelace'],
  ])('finds a post by %s, whatever its case', (_, query) => {
    expect(keys(engine.search(query.toUpperCase()))).toEqual(['travel']);
  });

  it('matches the start of a word', () => {
    expect(keys(engine.search('kube'))).toEqual(['n1']);
  });

  it('forgives one typo in a word of five characters or more, but not in a shorter word', () => {
    expect(keys(engine.search('kubernetis'))).toEqual(['n1']);
    expect(keys(engine.search('kyota'))).toEqual(['travel']);
    expect(engine.search('kyxo')).toEqual([]);
  });

  it('needs every word of the query to match', () => {
    expect(keys(engine.search('react hooks'))).toEqual(['hooks']);
  });

  it('finds nothing for a query under two characters', () => {
    expect(engine.search(' k ')).toEqual([]);
  });
});
