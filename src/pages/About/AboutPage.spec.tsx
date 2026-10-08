import { useQuery } from '@apollo/client';
import { render, screen } from '@testUtils/rtlUtils';
import * as Monitoring from '@monitoring';
import AboutPage from './AboutPage';

jest.mock('@apollo/client', () => ({ ...(jest.requireActual('@apollo/client') as object), useQuery: jest.fn() }));
jest.mock('@monitoring', () => ({ captureException: jest.fn(), captureScope: jest.fn(), Severity: { Error: 'error' } }));
jest.mock('remark-gfm', () => () => {});

const fallbackStory = /began with a simple question/;

const expectFallbackStory = () => {
  expect(screen.getByRole('heading', { name: 'Our Story' })).toBeInTheDocument();
  expect(screen.getByText(fallbackStory)).toBeInTheDocument();
  expect(screen.queryByText(/Yikes!/)).not.toBeInTheDocument();
  expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
};

describe('AboutPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the about copy from Contentful', () => {
    (useQuery as jest.Mock).mockReturnValue({
      loading: false,
      data: { aboutCollection: { items: [{ title: 'Who we are', content: 'Journal is a collection of thoughts.' }] } },
    });

    render(<AboutPage />);

    expect(screen.getByRole('heading', { name: 'Who we are' })).toBeInTheDocument();
    expect(screen.getByText('Journal is a collection of thoughts.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Our Story' })).not.toBeInTheDocument();
    expect(screen.queryByText(fallbackStory)).not.toBeInTheDocument();
    // There is no newsletter provider yet, so there is nothing to subscribe to.
    expect(screen.queryByRole('button', { name: /Subscribe/ })).not.toBeInTheDocument();
  });

  it('falls back to the built-in copy when Contentful has no about entry', () => {
    (useQuery as jest.Mock).mockReturnValue({ loading: false, data: { aboutCollection: { items: [] } } });

    render(<AboutPage />);

    expectFallbackStory();
  });

  it('keeps the built-in heading and copy together when the entry has a title but no content', () => {
    (useQuery as jest.Mock).mockReturnValue({
      loading: false,
      data: { aboutCollection: { items: [{ title: 'Who we are', content: '' }] } },
    });

    render(<AboutPage />);

    expectFallbackStory();
    expect(screen.queryByRole('heading', { name: 'Who we are' })).not.toBeInTheDocument();
  });

  it('shows the built-in copy while the about entry loads', () => {
    (useQuery as jest.Mock).mockReturnValue({ loading: true });

    render(<AboutPage />);

    expectFallbackStory();
  });

  it('reports a failed query and still shows the built-in copy', () => {
    const error = new Error('down');
    (useQuery as jest.Mock).mockReturnValue({ loading: false, error });

    render(<AboutPage />);

    expectFallbackStory();
    expect(Monitoring.captureException).toHaveBeenCalledTimes(1);
    expect(Monitoring.captureException).toHaveBeenCalledWith(error, undefined);
    expect(Monitoring.captureScope).toHaveBeenCalledWith(
      { type: 'component', data: { component: 'AboutPage' } },
      'error',
    );
  });
});
