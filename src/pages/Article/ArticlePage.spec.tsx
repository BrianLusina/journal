import faker from 'faker';
import { render, act, screen } from '@testUtils/rtlUtils';
import * as Monitoring from '@monitoring';
import ArticlePage from './ArticlePage';
import { usePost } from '@hooks';
import { MemoryRouter } from 'react-router-dom';

jest.mock('@monitoring', () => {
  return {
    captureException: jest.fn(),
    captureScope: jest.fn(),
    Severity: {
      Error: 'error',
    },
  };
});

 
jest.mock('remark-gfm', () => () => {});

jest.mock('@/hooks/cms/usePost');
jest.mock('@/hooks/cms/usePosts', () => ({ usePosts: () => ({ data: null, loading: true, error: null }) }));
jest.mock('@/features/AuthorBadge', () => ({ __esModule: true, default: ({ author }: { author: UnifiedAuthor }) => <span>author {author.id}</span> }));

describe('ArticlePage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state', async () => {
    (usePost as jest.Mock).mockReturnValue({
      data: null,
      loading: true,
      error: null,
    });
    await act(async () => {
      render(
        <ArticlePage />
      );
    });

    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
  });

  it('should display error if query fails to fetch article', async () => {
    const mockError = new Error(faker.lorem.words());
    
    (usePost as jest.Mock).mockReturnValue({
      data: null,
      loading: false,
      error: mockError,
    });

    await act(async () => {
      render(
        <ArticlePage />
      );
    });

    const errorMsg = await screen.findByText(/Yikes! Something terrible has happened/i);
    expect(errorMsg).toBeInTheDocument();

    expect(Monitoring.captureException).toBeCalledTimes(1);
    expect(Monitoring.captureScope).toBeCalledTimes(1);
  });

  it('renders the article with its tags and authors', async () => {
    (usePost as jest.Mock).mockReturnValue({
      data: {
        id: 'n1',
        source: 'notion',
        title: 'Walking the Alps',
        subtitle: 'A slow route',
        category: 'Travel',
        slug: 'walking-the-alps',
        body: 'Body text',
        publishDate: '2024-02-01',
        tags: ['Hiking'],
        authors: [{ id: 'a1', source: 'notion', name: 'Ada' }],
      },
      loading: false,
      error: null,
    });

    await act(async () => {
      render(<ArticlePage />);
    });

    expect(screen.getByRole('heading', { name: 'Walking the Alps' })).toBeInTheDocument();
    expect(screen.getByText('February 1, 2024', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('#Hiking').closest('a')).toHaveAttribute('href', '/article/tag/hiking');
    expect(screen.getByText('author a1')).toBeInTheDocument();
  });

  it('redirects to the 404 page when no source has the post', async () => {
    (usePost as jest.Mock).mockReturnValue({ data: null, loading: false, error: null });

    await act(async () => {
      render(<ArticlePage />);
    });

    expect(window.location.pathname).toBe('/404');
  });
});
