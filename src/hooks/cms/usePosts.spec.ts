import { act, renderHook } from '@testing-library/react-hooks';
import { ContentfulAdapter } from '@services/cms/ContentfulAdapter';
import { NotionAdapter } from '@services/cms/NotionAdapter';
import { usePosts } from './usePosts';

jest.mock('@services/cms/ContentfulAdapter', () => ({
  ContentfulAdapter: jest.fn(),
}));

jest.mock('@services/cms/NotionAdapter', () => ({
  NotionAdapter: jest.fn(),
}));

const contentfulPosts = [
  {
    id: 'contentful-1',
    source: 'contentful',
    title: 'Older',
    slug: 'older',
    publishDate: '2024-01-01',
    tags: [],
    authors: [],
  },
];

const notionPosts = [
  {
    id: 'notion-1',
    source: 'notion',
    title: 'Newer',
    slug: 'newer',
    publishDate: '2024-02-01',
    tags: [],
    authors: [],
  },
];

describe('usePosts', () => {
  const getContentfulPosts = jest.fn();
  const getNotionPosts = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (ContentfulAdapter as jest.Mock).mockImplementation(() => ({
      getPosts: getContentfulPosts,
    }));
    (NotionAdapter as jest.Mock).mockImplementation(() => ({
      getPosts: getNotionPosts,
    }));
    getContentfulPosts.mockResolvedValue({
      items: contentfulPosts,
      total: 1,
      limit: 2,
      skip: 0,
    });
    getNotionPosts.mockResolvedValue({
      items: notionPosts,
      total: 1,
      limit: 2,
      skip: 0,
    });
  });

  it('merges sources and applies pagination after sorting', async () => {
    const { result, waitForNextUpdate } = renderHook(() => usePosts({ limit: 1 }));

    await act(async () => {
      await waitForNextUpdate();
    });

    expect(result.current.data?.items.map(post => post.id)).toEqual(['notion-1']);
    expect(getContentfulPosts).toHaveBeenCalledWith({ limit: 1, skip: 0 });
    expect(getNotionPosts).toHaveBeenCalledWith({ limit: 1, skip: 0 });
  });

  it('refetches when the category changes', async () => {
    const { result, rerender, waitForNextUpdate } = renderHook(
      ({ category }) => usePosts({ category, limit: 3 }),
      { initialProps: { category: 'news' } },
    );

    await act(async () => {
      await waitForNextUpdate();
    });
    rerender({ category: 'guides' });

    await act(async () => {
      await waitForNextUpdate();
    });

    expect(getContentfulPosts).toHaveBeenLastCalledWith({
      category: 'guides',
      limit: 3,
      skip: 0,
    });
  });
});
