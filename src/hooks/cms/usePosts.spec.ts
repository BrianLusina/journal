import { renderHook } from '@testing-library/react-hooks';
import { captureException } from '@monitoring';
import { createMergedFeed } from '@cmsService';
import { usePosts } from './usePosts';

jest.mock('@monitoring', () => ({ captureException: jest.fn() }));
jest.mock('@cmsService', () => ({ cmsAdapters: ['adapters'], createMergedFeed: jest.fn() }));

const post = (id: string): UnifiedPost => ({ id, source: 'notion', title: id, slug: id, publishDate: '2024-02-01', tags: [], authors: [] });

describe('usePosts', () => {
  const load = jest.fn();

  beforeEach(() => {
    (createMergedFeed as jest.Mock).mockReturnValue({ load });
    load.mockImplementation(async (count: number) => ({
      items: Array.from({ length: count }, (_, index) => post(`p${index}`)),
      hasMore: true,
      errors: [],
    }));
  });

  it('loads the first posts of the merged feed', async () => {
    const { result, waitForNextUpdate } = renderHook(() => usePosts({ limit: 3 }));

    expect(result.current.loading).toBe(true);
    await waitForNextUpdate();

    expect(createMergedFeed).toHaveBeenCalledWith(['adapters'], {});
    expect(load).toHaveBeenCalledWith(3);
    expect(result.current).toEqual({ data: { items: [post('p0'), post('p1'), post('p2')], hasMore: true }, loading: false, error: null });
  });

  it('loads more from the same feed when the limit grows, instead of starting over', async () => {
    const { result, rerender, waitForNextUpdate } = renderHook(({ limit }) => usePosts({ limit }), {
      initialProps: { limit: 2 },
    });
    await waitForNextUpdate();

    rerender({ limit: 4 });
    await waitForNextUpdate();

    expect(createMergedFeed).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenLastCalledWith(4);
    expect(result.current.data?.items).toHaveLength(4);
  });

  it('keeps showing loaded posts while more are loading', async () => {
    const { result, rerender, waitForNextUpdate } = renderHook(({ limit }) => usePosts({ limit }), {
      initialProps: { limit: 2 },
    });
    await waitForNextUpdate();

    rerender({ limit: 4 });

    expect(result.current.loading).toBe(true);
    expect(result.current.data?.items).toHaveLength(2);
    await waitForNextUpdate();
  });

  it('starts a new feed when the category changes', async () => {
    const { rerender, waitForNextUpdate } = renderHook(({ category }) => usePosts({ category, limit: 3 }), {
      initialProps: { category: 'news' },
    });
    await waitForNextUpdate();

    rerender({ category: 'guides' });
    await waitForNextUpdate();

    expect(createMergedFeed).toHaveBeenNthCalledWith(1, ['adapters'], { category: 'news' });
    expect(createMergedFeed).toHaveBeenNthCalledWith(2, ['adapters'], { category: 'guides' });
  });

  it('starts a new feed when the tag changes', async () => {
    const { rerender, waitForNextUpdate } = renderHook(({ tag }) => usePosts({ tag, limit: 3 }), {
      initialProps: { tag: 'travel' },
    });
    await waitForNextUpdate();

    rerender({ tag: 'personalGrowth' });
    await waitForNextUpdate();

    expect(createMergedFeed).toHaveBeenNthCalledWith(1, ['adapters'], { tag: 'travel' });
    expect(createMergedFeed).toHaveBeenNthCalledWith(2, ['adapters'], { tag: 'personalGrowth' });
  });

  it('keeps the feed and reports sources that failed', async () => {
    const sourceError = new Error('Notion is down');
    load.mockResolvedValue({ items: [post('c1')], hasMore: false, errors: [sourceError] });

    const { result, waitForNextUpdate } = renderHook(() => usePosts({ limit: 3 }));
    await waitForNextUpdate();

    expect(result.current.data).toEqual({ items: [post('c1')], hasMore: false });
    expect(result.current.error).toBeNull();
    expect(captureException).toHaveBeenCalledWith(sourceError);
  });

  it('surfaces an error when no source could be loaded', async () => {
    const error = new Error('Everything is down');
    load.mockRejectedValue(error);

    const { result, waitForNextUpdate } = renderHook(() => usePosts());
    await waitForNextUpdate();

    expect(result.current.error).toBe(error);
    expect(result.current.loading).toBe(false);
  });
});
