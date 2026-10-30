import { StrictMode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

jest.mock('@/hooks/analytics/usePageView', () => jest.fn());
jest.mock('@/layouts/MainLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));
jest.mock('@/pages/NotFound', () => ({ __esModule: true, default: () => <p>Not found</p> }));
jest.mock('@/routes/routes', () => {
  const { lazy } = jest.requireActual('react');
  const { Link } = jest.requireActual('react-router-dom');
  const FirstPage = () => (
    <>
      <p>First page</p>
      <Link to="/second">Go to second</Link>
    </>
  );
  // Lazy, like the real routes, so the first visit suspends.
  const SecondPage = lazy(() => Promise.resolve({ default: () => <p>Second page</p> }));
  return {
    __esModule: true,
    default: [
      { path: '/', alternatePaths: [], component: () => <FirstPage /> },
      { path: '/second', alternatePaths: [], component: SecondPage },
    ],
  };
});

describe('App', () => {
  it('replaces the previous page when navigating to a lazily loaded route', async () => {
    render(
      <StrictMode>
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      </StrictMode>,
    );

    await userEvent.click(await screen.findByRole('link', { name: 'Go to second' }));

    expect(await screen.findByText('Second page')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('First page')).not.toBeInTheDocument(), { timeout: 1000 });
  });
});
