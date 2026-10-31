import { act, renderHook, waitFor } from '@testing-library/react';
import { loadSearchEngine } from '@/services/search';
import { useSearch } from './useSearch';

jest.mock('@/services/search', () => ({ loadSearchEngine: jest.fn() }));

const result = { key: 'contentful:c1', id: 'c1', source: 'contentful', slug: 'c1', title: 'React', tags: [], authors: [], publishDate: '2024-01-01' };

describe('useSearch', () => {
  it('loads the search engine and searches the query', async () => {
    const search = jest.fn().mockReturnValue([result]);
    (loadSearchEngine as jest.Mock).mockResolvedValue({ search });

    const { result: hook } = renderHook(() => useSearch('react'));

    expect(hook.current.status).toBe('loading');
    await waitFor(() => expect(hook.current.status).toBe('ready'));
    expect(search).toHaveBeenCalledWith('react');
    expect(hook.current.results).toEqual([result]);
  });

  it('reports an error, and loads again on retry', async () => {
    (loadSearchEngine as jest.Mock).mockRejectedValueOnce(new Error('offline'));

    const { result: hook } = renderHook(() => useSearch('react'));

    await waitFor(() => expect(hook.current.status).toBe('error'));
    expect(hook.current.results).toEqual([]);

    (loadSearchEngine as jest.Mock).mockResolvedValue({ search: () => [result] });
    act(() => hook.current.retry());

    await waitFor(() => expect(hook.current.status).toBe('ready'));
    expect(hook.current.results).toEqual([result]);
  });
});
