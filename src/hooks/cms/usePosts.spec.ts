import { renderHook } from '@testing-library/react-hooks';
import { captureException } from '@monitoring';
import { fetchMergedPosts } from '@cmsService';
import { usePosts } from './usePosts';

jest.mock('@monitoring', () => ({ captureException: jest.fn() }));
jest.mock('@cmsService', () => ({ cmsAdapters: ['adapters'], fetchMergedPosts: jest.fn() }));

const posts: PaginatedUnifiedPosts = {
  items: [{ id: 'n1', source: 'notion', title: 'Post', slug: 'post', publishDate: '2024-02-01', tags: [], authors: [] }],
  total: 1,
  limit: 3,
  skip: 0,
  hasMore: false,
};

describe('usePosts', () => {
  beforeEach(() => {
    (fetchMergedPosts as jest.Mock).mockResolvedValue({ ...posts, errors: [] });
  });

  it('loads the merged feed from the registered adapters', async () => {
    const { result, waitForNextUpdate } = renderHook(() => usePosts({ limit: 3 }));

    expect(result.current.loading).toBe(true);
    await waitForNextUpdate();

    expect(fetchMergedPosts).toHaveBeenCalledWith(['adapters'], { category: undefined, skip: undefined, limit: 3 });
    expect(result.current).toEqual({ data: posts, loading: false, error: null });
  });

  it('keeps the feed and reports sources that failed', async () => {
    const sourceError = new Error('Notion is down');
    (fetchMergedPosts as jest.Mock).mockResolvedValue({ ...posts, errors: [sourceError] });

    const { result, waitForNextUpdate } = renderHook(() => usePosts({ limit: 3 }));
    await waitForNextUpdate();

    expect(result.current.data).toEqual(posts);
    expect(result.current.error).toBeNull();
    expect(captureException).toHaveBeenCalledWith(sourceError);
  });

  it('surfaces an error when no source could be loaded', async () => {
    const error = new Error('Everything is down');
    (fetchMergedPosts as jest.Mock).mockRejectedValue(error);

    const { result, waitForNextUpdate } = renderHook(() => usePosts());
    await waitForNextUpdate();

    expect(result.current.error).toBe(error);
    expect(result.current.loading).toBe(false);
  });

  it('refetches when the category changes', async () => {
    const { rerender, waitForNextUpdate } = renderHook(({ category }) => usePosts({ category, limit: 3 }), {
      initialProps: { category: 'news' },
    });
    await waitForNextUpdate();

    rerender({ category: 'guides' });
    await waitForNextUpdate();

    expect(fetchMergedPosts).toHaveBeenLastCalledWith(['adapters'], { category: 'guides', skip: undefined, limit: 3 });
  });
});
