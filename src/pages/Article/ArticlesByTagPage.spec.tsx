import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import * as Monitoring from '@monitoring';
import useFetchArticlesByTag from '@/hooks/api/useFetchArticlesByTag';
import ArticlesByTagPage from './ArticlesByTagPage';

jest.mock('@monitoring', () => ({ captureException: jest.fn(), captureScope: jest.fn(), Severity: { Error: 'error' } }));
jest.mock('@/hooks/api/useFetchArticlesByTag');

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/article/tag/:tag" element={<ArticlesByTagPage />} />
        <Route path="/404" element={<p>not found</p>} />
      </Routes>
    </MemoryRouter>,
  );

const article = (id: string, thumbnail: { url: string } | null) => ({
  sys: { id },
  slug: `slug-${id}`,
  title: `Title ${id}`,
  category: 'Travel',
  publishDate: '2024-02-01T10:00:00.000Z',
  thumbnail,
});

describe('ArticlesByTagPage', () => {
  it('fetches articles for the tag in the URL and titles the page with it', () => {
    (useFetchArticlesByTag as jest.Mock).mockReturnValue([
      false,
      undefined,
      { blogPostCollection: { items: [article('a', { url: 'https://images/a.png' }), article('b', null)] } },
    ]);

    renderAt('/article/tag/personalGrowth');

    expect(useFetchArticlesByTag).toHaveBeenCalledWith('personalGrowth');
    expect(screen.getByText('Personal Growth articles.')).toBeInTheDocument();
    expect(screen.getByText('Title a')).toBeInTheDocument();
    expect(screen.getByText('Title b')).toBeInTheDocument();
  });

  it('shows the page loader while loading', () => {
    (useFetchArticlesByTag as jest.Mock).mockReturnValue([true, undefined, undefined]);

    renderAt('/article/tag/travel');

    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
  });

  it('reports and shows an error', () => {
    (useFetchArticlesByTag as jest.Mock).mockReturnValue([false, new Error('down'), undefined]);

    renderAt('/article/tag/travel');

    expect(screen.getByText(/Yikes!/)).toBeInTheDocument();
    expect(Monitoring.captureException).toHaveBeenCalledTimes(1);
  });

  it('redirects to 404 when there is no data', () => {
    (useFetchArticlesByTag as jest.Mock).mockReturnValue([false, undefined, undefined]);

    renderAt('/article/tag/travel');

    expect(screen.getByText('not found')).toBeInTheDocument();
  });
});
