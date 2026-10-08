import { render, screen, userEvent } from '@testUtils/rtlUtils';
import * as Monitoring from '@monitoring';
import { usePosts } from '@hooks';
import ArticlesPage from './ArticlesPage';

jest.mock('@monitoring', () => ({ captureException: jest.fn(), captureScope: jest.fn(), Severity: { Error: 'error' } }));
jest.mock('@/hooks/cms/usePosts');

const post = (id: string, overrides: Partial<UnifiedPost> = {}): UnifiedPost => ({
  id,
  source: 'contentful',
  title: `Title ${id}`,
  slug: `slug-${id}`,
  category: 'Travel',
  publishDate: '2024-02-01',
  thumbnail: { url: `https://images/${id}.png` },
  tags: [],
  authors: [],
  ...overrides,
});

const mockPosts = (items: UnifiedPost[], hasMore = false, loading = false) =>
  (usePosts as jest.Mock).mockReturnValue({
    data: { items, hasMore },
    loading,
    error: null,
  });

describe('ArticlesPage', () => {
  it('shows the page loader before the first page arrives', () => {
    (usePosts as jest.Mock).mockReturnValue({ data: null, loading: true, error: null });

    render(<ArticlesPage />);

    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
  });

  it('reports and shows an error when posts cannot be loaded', () => {
    (usePosts as jest.Mock).mockReturnValue({ data: null, loading: false, error: new Error('down') });

    render(<ArticlesPage />);

    expect(screen.getByText(/Yikes! Something terrible has happened/i)).toBeInTheDocument();
    expect(Monitoring.captureException).toHaveBeenCalledTimes(1);
  });

  it('renders posts from every source with links to the article page', () => {
    mockPosts([post('a'), post('b', { source: 'notion', thumbnail: undefined, category: undefined })]);

    render(<ArticlesPage />);

    expect(screen.getByText('Title a').closest('a')).toHaveAttribute('href', '/article/a/slug-a');
    expect(screen.getByText('Title b')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Load More' })).not.toBeInTheDocument();
  });

  it('requests the next page when Load More is clicked', () => {
    mockPosts([post('a')], true);

    render(<ArticlesPage />);
    expect(usePosts).toHaveBeenLastCalledWith({ limit: 10 });

    userEvent.click(screen.getByRole('button', { name: 'Load More' }));

    expect(usePosts).toHaveBeenLastCalledWith({ limit: 11 });
  });

  it('keeps showing loaded posts while the next page loads', () => {
    mockPosts([post('a')], true, true);

    render(<ArticlesPage />);

    expect(screen.getByText('Title a')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Load More' })).toBeDisabled();
  });
});
