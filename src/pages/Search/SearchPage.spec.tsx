import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Helmet } from 'react-helmet';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { FEATURE_DEFAULTS } from '@/config/features';
import FeaturesProvider from '@/providers/features';
import { loadSearchEngine } from '@/services/search';
import { createSearchEngine } from '@/services/search/searchEngine';
import { logSearchSelection } from '@/services/search/searchAnalytics';
import type { SearchDocument } from '@/services/search/SearchDocument';
import SearchPage from './SearchPage';

jest.mock('@/services/search', () => ({ loadSearchEngine: jest.fn() }));
jest.mock('@/services/search/searchAnalytics', () => ({ logSearch: jest.fn(), logSearchSelection: jest.fn() }));

const doc = (id: string, title: string): SearchDocument => ({
  key: `contentful:${id}`,
  id,
  source: 'contentful',
  slug: `${id}-slug`,
  title,
  category: 'Tech',
  tags: [],
  authors: [],
  publishDate: '2024-01-01',
});

const Location = () => {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid="location">{`${location.pathname}${location.search}`}</output>
      <button type="button" onClick={() => navigate(-1)}>
        Back
      </button>
    </>
  );
};

/** Renders the page at `url`, one history entry after `/`, as the app's router does. */
const renderPage = async (url: string, search = true) => {
  render(
    <FeaturesProvider value={{ ...FEATURE_DEFAULTS, search }}>
      <MemoryRouter initialEntries={['/', url]} initialIndex={1}>
        <Routes>
          <Route path="/search" element={<SearchPage />} />
          <Route path="/article/:id/:slug" element={<p>article</p>} />
          <Route path="/" element={<p>home</p>} />
        </Routes>
        <Location />
      </MemoryRouter>
    </FeaturesProvider>,
  );
  await act(async () => undefined);
};

describe('SearchPage', () => {
  beforeEach(() => {
    (loadSearchEngine as jest.Mock).mockResolvedValue(
      createSearchEngine([doc('c1', 'React Hooks'), doc('c2', 'Kyoto in Autumn')]),
    );
  });

  it('shows the results for the query in the URL, and keeps crawlers from indexing it', async () => {
    await renderPage('/search?q=kyoto');

    expect(screen.getByRole('searchbox', { name: 'Search posts' })).toHaveValue('kyoto');
    expect(await screen.findByRole('link', { name: /Kyoto in Autumn/ })).toHaveAttribute('href', '/article/c2/c2-slug');
    expect(screen.queryByText('React Hooks')).not.toBeInTheDocument();
    await waitFor(() =>
      expect(Helmet.peek().metaTags).toEqual([{ name: 'robots', content: 'noindex, follow' }]),
    );
  });

  it('keeps the query in the URL as it is typed, without adding history entries', async () => {
    const user = userEvent.setup();
    await renderPage('/search');

    await user.type(screen.getByRole('searchbox'), 'react');

    expect(screen.getByTestId('location')).toHaveTextContent('/search?q=react');
    expect(screen.getByRole('searchbox')).toHaveValue('react');
    expect(await screen.findByRole('link', { name: /React Hooks/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/);
  });

  it('logs the result a reader opens', async () => {
    const user = userEvent.setup();
    await renderPage('/search?q=react');

    await user.click(await screen.findByRole('link', { name: /React Hooks/ }));

    expect(logSearchSelection).toHaveBeenCalledWith('c1-slug', 'page');
    expect(screen.getByText('article')).toBeInTheDocument();
  });

  it('is not found while the search feature is off', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await renderPage('/search?q=react', false);

    expect(screen.getByText('Oops! Page not found')).toBeInTheDocument();
    expect(loadSearchEngine).not.toHaveBeenCalled();
  });
});
