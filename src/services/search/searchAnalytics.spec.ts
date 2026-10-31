import analytics from '@/services/analytics';
import { logSearch, logSearchSelection, mayBePersonal, normalizeSearchTerm, resetSearchLog } from './searchAnalytics';

jest.mock('@/services/analytics', () => ({ __esModule: true, default: { logEvent: jest.fn() } }));

describe('search analytics', () => {
  beforeEach(() => resetSearchLog());

  it('normalizes a term: trimmed, lowercased, whitespace collapsed, at most 100 characters', () => {
    expect(normalizeSearchTerm('  Data   Structures\n')).toBe('data structures');
    expect(normalizeSearchTerm('a'.repeat(150))).toHaveLength(100);
  });

  it.each(['ada@example.com', 'call +1 (555) 123-4567', '4111 1111 1111 1111'])('treats %p as personal', term => {
    expect(mayBePersonal(term)).toBe(true);
  });

  it.each(['react hooks', 'top 10 of 2024', 'es2020'])('does not treat %p as personal', term => {
    expect(mayBePersonal(term)).toBe(false);
  });

  it('sends a search event with the normalized term, the result count and where it was made', () => {
    logSearch('  React Hooks ', 3, 'modal');

    expect(analytics.logEvent).toHaveBeenCalledWith('search', { search_term: 'react hooks', results_count: 3, source: 'modal' });
  });

  it('does not send the same term twice in a row, even from the other surface', () => {
    logSearch('react', 3, 'modal');
    logSearch('React ', 3, 'page');
    logSearch('vue', 0, 'page');
    logSearch('react', 3, 'page');

    expect((analytics.logEvent as jest.Mock).mock.calls.map(([, params]) => params.search_term)).toEqual([
      'react',
      'vue',
      'react',
    ]);
  });

  it('sends nothing for a personal-looking or too-short term', () => {
    logSearch('ada@example.com', 0, 'page');
    logSearch('07123456789', 0, 'page');
    logSearch('a', 0, 'page');

    expect(analytics.logEvent).not.toHaveBeenCalled();
  });

  it('sends a select_content event with the opened post slug', () => {
    logSearchSelection('my-post', 'page');

    expect(analytics.logEvent).toHaveBeenCalledWith('select_content', { content_type: 'post', item_id: 'my-post', source: 'page' });
  });
});
