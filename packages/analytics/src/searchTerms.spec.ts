import { mayBePersonal, normalizeSearchTerm } from './searchTerms';

// The blog's cases (apps/blog/src/services/search/searchAnalytics.spec.ts), for the moved functions.
describe('search terms', () => {
  it('normalizes a term: trimmed, lowercased, whitespace collapsed, at most 100 characters', () => {
    expect(normalizeSearchTerm('  Data   Structures\n')).toBe('data structures');
    expect(normalizeSearchTerm('a'.repeat(150))).toHaveLength(100);
  });

  it.each(['ada@example.com', 'call +1 (555) 123-4567', '4111 1111 1111 1111', '555/123/4567', '123,456,7890'])('treats %p as personal', term => {
    expect(mayBePersonal(term)).toBe(true);
  });

  it.each(['react hooks', 'top 10 of 2024', 'es2020'])('does not treat %p as personal', term => {
    expect(mayBePersonal(term)).toBe(false);
  });
});
