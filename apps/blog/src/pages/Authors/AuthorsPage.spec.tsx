import type { Mock } from 'vitest';
import { render, screen } from '@testUtils/rtlUtils';
import * as Monitoring from '@/services/monitoring';
import useFetchAuthors from '@/hooks/api/useFetchAuthors';
import AuthorsPage from './AuthorsPage';

vi.mock('@/services/monitoring', () => ({ captureException: vi.fn(), captureScope: vi.fn(), Severity: { Error: 'error' } }));
vi.mock('@/hooks/api/useFetchAuthors');

const author = {
  name: 'Ada Lovelace',
  image: { url: 'https://images/ada.png' },
  role: 'Editor',
  shortBio: 'Writes about engines.',
  linkedFrom: { entryCollection: { total: 4 } },
  linkedIn: 'https://linkedin.com/in/ada',
  email: 'ada@example.com',
};

describe('AuthorsPage', () => {
  it('lists authors with their article counts and contact links', () => {
    (useFetchAuthors as Mock).mockReturnValue([false, undefined, { personCollection: { items: [author] } }]);

    render(<AuthorsPage />);

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Editor')).toBeInTheDocument();
    expect(screen.getByText('4 articles published')).toBeInTheDocument();
    expect(document.querySelector('a[href="https://linkedin.com/in/ada"]')).toBeInTheDocument();
    expect(document.querySelector('a[href="mailto:ada@example.com"]')).toBeInTheDocument();
  });

  it('shows the page loader while loading', () => {
    (useFetchAuthors as Mock).mockReturnValue([true, undefined, undefined]);

    render(<AuthorsPage />);

    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
  });

  it('reports and shows an error', () => {
    (useFetchAuthors as Mock).mockReturnValue([false, new Error('down'), undefined]);

    render(<AuthorsPage />);

    expect(screen.getByText(/Yikes!/)).toBeInTheDocument();
    expect(Monitoring.captureException).toHaveBeenCalledTimes(1);
  });
});
