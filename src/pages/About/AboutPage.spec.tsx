import { useQuery } from '@apollo/client';
import { render, screen } from '@testUtils/rtlUtils';
import * as Monitoring from '@monitoring';
import AboutPage from './AboutPage';

jest.mock('@apollo/client', () => ({ ...(jest.requireActual('@apollo/client') as object), useQuery: jest.fn() }));
jest.mock('@monitoring', () => ({ captureException: jest.fn(), captureScope: jest.fn(), Severity: { Error: 'error' } }));

describe('AboutPage', () => {
  it('renders the about content', () => {
    (useQuery as jest.Mock).mockReturnValue({ loading: false, data: { aboutCollection: { items: [] } } });

    render(<AboutPage />);

    expect(screen.getByText('Our Story')).toBeInTheDocument();
    // There is no newsletter provider yet, so there is nothing to subscribe to.
    expect(screen.queryByRole('button', { name: /Subscribe/ })).not.toBeInTheDocument();
  });

  it('shows a loading state', () => {
    (useQuery as jest.Mock).mockReturnValue({ loading: true });

    render(<AboutPage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('reports and shows an error', () => {
    (useQuery as jest.Mock).mockReturnValue({ loading: false, error: new Error('down') });

    render(<AboutPage />);

    expect(screen.getByText(/Yikes!/)).toBeInTheDocument();
    expect(Monitoring.captureException).toHaveBeenCalledTimes(1);
  });
});
