import { useQuery } from '@apollo/client';
import { render, screen } from '@testUtils/rtlUtils';
import * as Monitoring from '@monitoring';
import FeaturedArticles from './FeaturedArticles';

jest.mock('@apollo/client', () => ({ ...jest.requireActual('@apollo/client'), useQuery: jest.fn() }));
jest.mock('@monitoring', () => ({ captureException: jest.fn(), captureScope: jest.fn(), Severity: { Error: 'error' } }));

const article = (id: string) => ({
  sys: { id },
  slug: `slug-${id}`,
  title: `Title ${id}`,
  category: 'Travel',
  publishDate: '2024-02-01T10:00:00.000Z',
  thumbnail: { url: `https://images/${id}.png` },
});

describe('FeaturedArticles', () => {
  it('shows only the featured number of articles and links to all articles', () => {
    (useQuery as jest.Mock).mockReturnValue({
      loading: false,
      error: undefined,
      data: { blogPostCollection: { items: [article('a'), article('b'), article('c')] } },
    });

    render(<FeaturedArticles featuredCount={2} />);

    expect(screen.getByText('Title a')).toBeInTheDocument();
    expect(screen.getByText('Title b')).toBeInTheDocument();
    expect(screen.queryByText('Title c')).not.toBeInTheDocument();
    expect(screen.getByText('View all →')).toHaveAttribute('href', '/articles');
  });

  it('shows a loading state', () => {
    (useQuery as jest.Mock).mockReturnValue({ loading: true });

    render(<FeaturedArticles />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('reports and shows an error', () => {
    (useQuery as jest.Mock).mockReturnValue({ loading: false, error: new Error('down') });

    render(<FeaturedArticles />);

    expect(screen.getByText(/Yikes!/)).toBeInTheDocument();
    expect(Monitoring.captureException).toHaveBeenCalledTimes(1);
  });
});
