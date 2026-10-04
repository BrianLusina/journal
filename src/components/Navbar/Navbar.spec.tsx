import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAppWithRouter from '@testUtils/MockAppWithRouter';
import navbarItems from './constants';
import Navbar from './Navbar';

const renderNavbar = () =>
  render(
    <MockAppWithRouter>
      <Navbar />
    </MockAppWithRouter>,
  );

describe('Navbar', () => {
  beforeEach(() => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: false });
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('should render', () => {
    renderNavbar();

    navbarItems.forEach((item) => {
      expect(screen.getAllByText(item.name)[0]).toBeInTheDocument();
    });
  });

  it('closes the mobile menu after a link is followed', () => {
    const { container } = renderNavbar();

    userEvent.click(screen.getByLabelText('Toggle menu'));
    const mobileMenu = container.querySelector('.md\\:hidden.py-4') as HTMLElement;
    userEvent.click(within(mobileMenu).getByText('Articles'));

    expect(container.querySelector('.md\\:hidden.py-4')).not.toBeInTheDocument();
  });

  it('toggles dark mode and remembers the choice', () => {
    renderNavbar();

    userEvent.click(screen.getByLabelText('Toggle theme'));
    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem('theme')).toBe('dark');

    userEvent.click(screen.getByLabelText('Toggle theme'));
    expect(document.documentElement).not.toHaveClass('dark');
    expect(localStorage.getItem('theme')).toBe('light');
  });
});
