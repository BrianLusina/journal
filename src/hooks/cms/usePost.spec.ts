import type { Mock } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { findPostBySlug } from '@cmsService';
import { usePost } from './usePost';

vi.mock('@cmsService', () => ({ cmsAdapters: ['adapters'], findPostBySlug: vi.fn() }));

describe('usePost', () => {
  it('returns the post found across the registered adapters', async () => {
    const post = { id: 'n1', source: 'notion', title: 'Post', slug: 'post', publishDate: '2024-01-01', tags: [], authors: [] };
    (findPostBySlug as Mock).mockResolvedValue(post);

    const { result } = renderHook(() => usePost('post'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(findPostBySlug).toHaveBeenCalledWith(['adapters'], 'post');
    expect(result.current).toEqual({ data: post, loading: false, error: null });
  });

  it('reports a missing post as no data and no error so the page can show a 404', async () => {
    (findPostBySlug as Mock).mockResolvedValue(null);

    const { result } = renderHook(() => usePost('missing'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current).toEqual({ data: null, loading: false, error: null });
  });

  it('surfaces the error when the post could not be loaded', async () => {
    const error = new Error('Contentful unavailable');
    (findPostBySlug as Mock).mockRejectedValue(error);

    const { result } = renderHook(() => usePost('post'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeNull();
  });

  it('does not fetch without a slug', () => {
    const { result } = renderHook(() => usePost(undefined));

    expect(findPostBySlug).not.toHaveBeenCalled();
    expect(result.current).toEqual({ data: null, loading: false, error: null });
  });
});
