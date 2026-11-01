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

  it('asks for the engine again each time it becomes active, keeping the current results meanwhile', async () => {
    const fresh = { ...result, title: 'React, refreshed' };
    (loadSearchEngine as jest.Mock).mockResolvedValue({ search: () => [result] });
    const { result: hook, rerender } = renderHook(({ active }) => useSearch('react', active), {
      initialProps: { active: true },
    });
    await waitFor(() => expect(hook.current.status).toBe('ready'));

    rerender({ active: false });
    (loadSearchEngine as jest.Mock).mockResolvedValue({ search: () => [fresh] });
    rerender({ active: true });

    expect(hook.current.status).toBe('ready');
    expect(hook.current.results).toEqual([result]);
    await waitFor(() => expect(hook.current.results).toEqual([fresh]));
    expect(loadSearchEngine).toHaveBeenCalledTimes(2);
  });

  it('loads nothing while inactive', async () => {
    renderHook(() => useSearch('react', false));
    await act(async () => undefined);

    expect(loadSearchEngine).not.toHaveBeenCalled();
  });

  it('asks for the engine again when the query changes, so a page left open picks up a newer index', async () => {
    const fresh = { ...result, title: 'React, refreshed' };
    (loadSearchEngine as jest.Mock).mockResolvedValue({ search: () => [result] });
    const { result: hook, rerender } = renderHook(({ query }) => useSearch(query), { initialProps: { query: 'react' } });
    await waitFor(() => expect(hook.current.status).toBe('ready'));

    (loadSearchEngine as jest.Mock).mockResolvedValue({ search: () => [fresh] });
    rerender({ query: 'reacts' });

    await waitFor(() => expect(hook.current.results).toEqual([fresh]));
    expect(hook.current.status).toBe('ready');
  });

  it('keeps searching the engine it has when a later reload fails', async () => {
    (loadSearchEngine as jest.Mock).mockResolvedValue({ search: () => [result] });
    const { result: hook, rerender } = renderHook(({ query }) => useSearch(query), { initialProps: { query: 'react' } });
    await waitFor(() => expect(hook.current.status).toBe('ready'));

    (loadSearchEngine as jest.Mock).mockRejectedValue(new Error('offline'));
    rerender({ query: 'reacts' });
    await act(async () => undefined);

    expect(hook.current.status).toBe('ready');
    expect(hook.current.results).toEqual([result]);
  });
});
