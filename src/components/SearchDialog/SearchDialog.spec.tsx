import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { loadSearchEngine } from '@/services/search';
import { createSearchEngine } from '@/services/search/searchEngine';
import { logSearch, logSearchSelection } from '@/services/search/searchAnalytics';
import type { SearchDocument } from '@/services/search/SearchDocument';
import SearchDialog from './SearchDialog';

jest.mock('@/services/search', () => ({ loadSearchEngine: jest.fn() }));
jest.mock('@/services/search/searchAnalytics', () => ({ logSearch: jest.fn(), logSearchSelection: jest.fn() }));

const doc = (id: string, title: string, fields: Partial<SearchDocument> = {}): SearchDocument => ({
  key: `contentful:${id}`,
  id,
  source: 'contentful',
  slug: `${id}-slug`,
  title,
  tags: [],
  authors: [],
  publishDate: '2024-01-01',
  ...fields,
});

const Location = () => {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
};

/** Renders the dialog open, and lets the index finish loading. */
const renderDialog = async (onOpenChange = jest.fn()) => {
  render(
    <MemoryRouter>
      <SearchDialog open onOpenChange={onOpenChange} />
      <Routes>
        <Route path="*" element={<Location />} />
      </Routes>
    </MemoryRouter>,
  );
  await act(async () => undefined);
};

describe('SearchDialog', () => {
  beforeEach(() => {
    (loadSearchEngine as jest.Mock).mockResolvedValue(
      createSearchEngine([
        doc('c1', 'React Hooks', { category: 'Tech' }),
        doc('c2', 'React Native', { description: 'Apps' }),
        doc('n1', 'Kyoto', { key: 'notion:n1', source: 'notion' }),
      ]),
    );
  });

  it('is a named dialog whose search box starts focused', async () => {
    await renderDialog();

    expect(screen.getByRole('dialog', { name: 'Search posts' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Search posts' })).toHaveFocus();
    expect(screen.getByText('Type at least 2 characters to search posts.')).toBeInTheDocument();
  });

  it('lists the matching posts, then "See all results"', async () => {
    const user = userEvent.setup();
    await renderDialog();

    await user.type(screen.getByRole('combobox'), 'react');

    const options = await screen.findAllByRole('option');
    expect(options.map(option => option.textContent)).toEqual(['React HooksTech', 'React NativeApps', 'See all results']);
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('2 posts found');
  });

  it('moves through the results with the arrow keys and opens the active one with Enter', async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    await renderDialog(onOpenChange);
    const input = screen.getByRole('combobox');

    await user.type(input, 'react');
    await screen.findAllByRole('option');
    await user.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute('aria-activedescendant', screen.getAllByRole('option')[1].id);
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowUp}{ArrowUp}{ArrowUp}{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(screen.getByTestId('location')).toHaveTextContent('/article/c2/c2-slug');
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(logSearch).toHaveBeenCalledWith('react', 2, 'modal');
    expect(logSearchSelection).toHaveBeenCalledWith('c2-slug', 'modal');
  });

  it('leaves Enter to the input method while it is composing text', async () => {
    const user = userEvent.setup();
    await renderDialog();
    const input = screen.getByRole('combobox');

    await user.type(input, 'react');
    await screen.findAllByRole('option');
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });

    expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/);
  });

  it('opens the search page for the query from "See all results"', async () => {
    const user = userEvent.setup();
    await renderDialog();

    await user.type(screen.getByRole('combobox'), ' react ');
    await user.click(await screen.findByRole('option', { name: /See all results/ }));

    expect(screen.getByTestId('location')).toHaveTextContent('/search?q=react');
  });

  it('opens a result when it is clicked', async () => {
    const user = userEvent.setup();
    await renderDialog();

    await user.type(screen.getByRole('combobox'), 'kyoto');
    await user.click(await screen.findByRole('option', { name: 'Kyoto' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/article/n1/n1-slug');
  });

  it('says when nothing matches', async () => {
    const user = userEvent.setup();
    await renderDialog();

    await user.type(screen.getByRole('combobox'), 'zebra');

    expect(await screen.findByText('No posts match “zebra”.')).toBeInTheDocument();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('asks to close on Escape', async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    await renderDialog(onOpenChange);

    await user.keyboard('{Escape}');

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('offers to try again when the index fails to load', async () => {
    (loadSearchEngine as jest.Mock).mockRejectedValueOnce(new Error('offline'));
    const user = userEvent.setup();
    await renderDialog();

    await user.click(await screen.findByRole('button', { name: 'Try again' }));
    await user.type(screen.getByRole('combobox'), 'kyoto');

    await waitFor(() => expect(screen.getByRole('option', { name: 'Kyoto' })).toBeInTheDocument());
  });
});
