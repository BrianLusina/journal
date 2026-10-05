import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import * as Monitoring from '@monitoring';
import { usePosts } from '@hooks';
import ArticlesByTagPage from './ArticlesByTagPage';

jest.mock('@monitoring', () => ({ captureException: jest.fn(), captureScope: jest.fn(), Severity: { Error: 'error' } }));
jest.mock('@hooks', () => ({ usePosts: jest.fn() }));

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/article/tag/:tag" element={<ArticlesByTagPage />} />
      </Routes>
    </MemoryRouter>,
  );

const article = (id: string, source: CMSSource, thumbnail?: UnifiedAsset): UnifiedPost => ({
  id,
  source,
  slug: `slug-${id}`,
  title: `Title ${id}`,
  category: 'Travel',
  publishDate: '2024-02-01T10:00:00.000Z',
  thumbnail,
  tags: [],
  authors: [],
});

describe('ArticlesByTagPage', () => {
  it('lists posts from every source for the tag in the URL and titles the page with it', () => {
    (usePosts as jest.Mock).mockReturnValue({
      loading: false,
      error: null,
      data: { items: [article('a', 'contentful', { url: 'https://images/a.png' }), article('b', 'notion')], hasMore: false },
    });

    renderAt('/article/tag/personalGrowth');

    expect(usePosts).toHaveBeenCalledWith({ tag: 'personalGrowth' });
    expect(screen.getByText('Personal Growth articles.')).toBeInTheDocument();
    expect(screen.getByText('Title a')).toBeInTheDocument();
    expect(screen.getByText('Title b')).toBeInTheDocument();
  });

  it('shows the page loader while loading', () => {
    (usePosts as jest.Mock).mockReturnValue({ loading: true, error: null, data: null });

    renderAt('/article/tag/travel');

    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
  });

  it('reports and shows an error', () => {
    (usePosts as jest.Mock).mockReturnValue({ loading: false, error: new Error('down'), data: null });

    renderAt('/article/tag/travel');

    expect(screen.getByText(/Yikes!/)).toBeInTheDocument();
    expect(Monitoring.captureException).toHaveBeenCalledTimes(1);
  });
});
