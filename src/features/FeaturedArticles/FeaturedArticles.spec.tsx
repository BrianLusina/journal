import { render, screen } from '@testUtils/rtlUtils';
import * as Monitoring from '@monitoring';
import { usePosts } from '@hooks';
import FeaturedArticles from './FeaturedArticles';

jest.mock('@hooks', () => ({ usePosts: jest.fn() }));
jest.mock('@monitoring', () => ({ captureException: jest.fn(), captureScope: jest.fn(), Severity: { Error: 'error' } }));

const article = (id: string, source: CMSSource): UnifiedPost => ({
  id,
  source,
  slug: `slug-${id}`,
  title: `Title ${id}`,
  category: 'Travel',
  publishDate: '2024-02-01T10:00:00.000Z',
  thumbnail: { url: `https://images/${id}.png` },
  tags: [],
  authors: [],
});

describe('FeaturedArticles', () => {
  it('shows the newest posts from every source, up to the featured number, and links to all articles', () => {
    (usePosts as jest.Mock).mockReturnValue({
      loading: false,
      error: null,
      data: { items: [article('a', 'contentful'), article('b', 'notion')], hasMore: true },
    });

    render(<FeaturedArticles featuredCount={2} />);

    expect(usePosts).toHaveBeenCalledWith({ limit: 2 });
    expect(screen.getByText('Title a')).toBeInTheDocument();
    expect(screen.getByText('Title b')).toBeInTheDocument();
    expect(screen.getByText('View all →')).toHaveAttribute('href', '/articles');
  });

  it('shows a loading state', () => {
    (usePosts as jest.Mock).mockReturnValue({ loading: true, error: null, data: null });

    render(<FeaturedArticles />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('reports and shows an error', () => {
    (usePosts as jest.Mock).mockReturnValue({ loading: false, error: new Error('down'), data: null });

    render(<FeaturedArticles />);

    expect(screen.getByText(/Yikes!/)).toBeInTheDocument();
    expect(Monitoring.captureException).toHaveBeenCalledTimes(1);
  });
});
