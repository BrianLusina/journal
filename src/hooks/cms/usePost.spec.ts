import { act, renderHook } from '@testing-library/react-hooks';
import { ContentfulAdapter } from '@services/cms/ContentfulAdapter';
import { NotionAdapter } from '@services/cms/NotionAdapter';
import { usePost } from './usePost';

jest.mock('@services/cms/ContentfulAdapter', () => ({
  ContentfulAdapter: jest.fn(),
}));

jest.mock('@services/cms/NotionAdapter', () => ({
  NotionAdapter: jest.fn(),
}));

describe('usePost', () => {
  const getContentfulPost = jest.fn();
  const getNotionPost = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (ContentfulAdapter as jest.Mock).mockImplementation(() => ({
      getPostBySlug: getContentfulPost,
    }));
    (NotionAdapter as jest.Mock).mockImplementation(() => ({
      getPostBySlug: getNotionPost,
    }));
  });

  it('surfaces an adapter error when no source can load the post', async () => {
    const error = new Error('Contentful unavailable');
    getContentfulPost.mockRejectedValue(error);
    getNotionPost.mockResolvedValue(null);

    const { result, waitForNextUpdate } = renderHook(() => usePost('missing'));

    await act(async () => {
      await waitForNextUpdate();
    });

    expect(result.current.error).toBe(error);
  });

  it('returns the first matching post across sources', async () => {
    const post = {
      id: 'notion-1',
      source: 'notion',
      title: 'Post',
      slug: 'post',
      publishDate: '2024-01-01',
      tags: [],
      authors: [],
    };
    getContentfulPost.mockResolvedValue(null);
    getNotionPost.mockResolvedValue(post);

    const { result, waitForNextUpdate } = renderHook(() => usePost('post'));

    await act(async () => {
      await waitForNextUpdate();
    });

    expect(result.current.data).toEqual(post);
    expect(result.current.error).toBeNull();
  });
});
