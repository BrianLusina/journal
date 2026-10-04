import { render, screen } from '@testUtils/rtlUtils';
import * as Monitoring from '@/services/monitoring';
import { usePosts } from '@/hooks/cms/usePosts';
import RelatedArticles from './RelatedArticles';

jest.mock('@/services/monitoring', () => ({ captureException: jest.fn(), captureScope: jest.fn(), Severity: { Error: 'error' } }));
jest.mock('@/hooks/cms/usePosts');

describe('RelatedArticles', () => {
  it('asks for three posts in the same category', () => {
    (usePosts as jest.Mock).mockReturnValue({ data: null, loading: true, error: null });

    const { container } = render(<RelatedArticles category="Travel" />);

    expect(usePosts).toHaveBeenCalledWith({ category: 'Travel', limit: 3 });
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when there are no related posts', () => {
    (usePosts as jest.Mock).mockReturnValue({ data: { items: [], total: 0, limit: 3, skip: 0 }, loading: false, error: null });

    const { container } = render(<RelatedArticles category="Travel" />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders related posts', () => {
    (usePosts as jest.Mock).mockReturnValue({
      data: {
        items: [{ id: 'n1', source: 'notion', title: 'Alps', slug: 'alps', publishDate: '2024-02-01', tags: [], authors: [] }],
        total: 1,
        limit: 3,
        skip: 0,
      },
      loading: false,
      error: null,
    });

    render(<RelatedArticles category="Travel" />);

    expect(screen.getByText('You might also like')).toBeInTheDocument();
    expect(screen.getByText('Alps').closest('a')).toHaveAttribute('href', '/article/n1/alps');
  });

  it('reports an error', () => {
    (usePosts as jest.Mock).mockReturnValue({ data: null, loading: false, error: new Error('down') });

    render(<RelatedArticles category="Travel" />);

    expect(screen.getByText(/Yikes!/)).toBeInTheDocument();
    expect(Monitoring.captureException).toHaveBeenCalledTimes(1);
  });
});
