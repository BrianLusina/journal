import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { loadSearchEngine } from '@/services/search';
import SearchLauncher from './SearchLauncher';

jest.mock('@/services/search', () => ({ loadSearchEngine: jest.fn() }));

const renderLauncher = () =>
  render(
    <MemoryRouter>
      <input aria-label="Name" />
      <SearchLauncher />
    </MemoryRouter>,
  );

describe('SearchLauncher', () => {
  beforeEach(() => {
    (loadSearchEngine as jest.Mock).mockResolvedValue({ search: () => [] });
  });

  it('opens search from the button, and gives focus back to it on close', async () => {
    const user = userEvent.setup();
    renderLauncher();
    const button = screen.getByRole('button', { name: 'Search posts' });

    await user.click(button);
    expect(await screen.findByRole('dialog', { name: 'Search posts' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('combobox')).toHaveFocus());

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(button).toHaveFocus();
  });

  it.each([
    ['⌘K', '{Meta>}k{/Meta}'],
    ['Ctrl+K', '{Control>}k{/Control}'],
    ['/', '/'],
  ])('opens search with %s', async (_, keys) => {
    const user = userEvent.setup();
    renderLauncher();

    await user.keyboard(keys);

    expect(await screen.findByRole('dialog', { name: 'Search posts' })).toBeInTheDocument();
  });

  it('leaves the shortcuts alone while the reader is typing in a field', async () => {
    const user = userEvent.setup();
    renderLauncher();

    await user.type(screen.getByLabelText('Name'), 'a/b');
    await user.keyboard('{Control>}k{/Control}');

    expect(screen.getByLabelText('Name')).toHaveValue('a/b');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not load the search dialog before it is opened', () => {
    renderLauncher();

    expect(loadSearchEngine).not.toHaveBeenCalled();
  });
});
