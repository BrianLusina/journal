import { renderHook } from '@testing-library/react-hooks';
import { findPostBySlug } from '@cmsService';
import { usePost } from './usePost';

jest.mock('@cmsService', () => ({ cmsAdapters: ['adapters'], findPostBySlug: jest.fn() }));

describe('usePost', () => {
  it('returns the post found across the registered adapters', async () => {
    const post = { id: 'n1', source: 'notion', title: 'Post', slug: 'post', publishDate: '2024-01-01', tags: [], authors: [] };
    (findPostBySlug as jest.Mock).mockResolvedValue(post);

    const { result, waitForNextUpdate } = renderHook(() => usePost('post'));
    await waitForNextUpdate();

    expect(findPostBySlug).toHaveBeenCalledWith(['adapters'], 'post');
    expect(result.current).toEqual({ data: post, loading: false, error: null });
  });

  it('reports a missing post as no data and no error so the page can show a 404', async () => {
    (findPostBySlug as jest.Mock).mockResolvedValue(null);

    const { result, waitForNextUpdate } = renderHook(() => usePost('missing'));
    await waitForNextUpdate();

    expect(result.current).toEqual({ data: null, loading: false, error: null });
  });

  it('surfaces the error when the post could not be loaded', async () => {
    const error = new Error('Contentful unavailable');
    (findPostBySlug as jest.Mock).mockRejectedValue(error);

    const { result, waitForNextUpdate } = renderHook(() => usePost('post'));
    await waitForNextUpdate();

    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeNull();
  });

  it('does not fetch without a slug', () => {
    const { result } = renderHook(() => usePost(undefined));

    expect(findPostBySlug).not.toHaveBeenCalled();
    expect(result.current).toEqual({ data: null, loading: false, error: null });
  });
});
