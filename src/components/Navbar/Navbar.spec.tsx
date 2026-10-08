import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useTheme } from 'next-themes';
import MockAppWithRouter from '@testUtils/MockAppWithRouter';
import ThemeProvider from '@providers/theme/ThemeProvider';
import navbarItems from './constants';
import Navbar from './Navbar';

const ResolvedTheme = () => <span data-testid="resolved-theme">{useTheme().resolvedTheme}</span>;

const renderNavbar = () =>
  render(
    <ThemeProvider>
      <MockAppWithRouter>
        <Navbar />
        <ResolvedTheme />
      </MockAppWithRouter>
    </ThemeProvider>,
  );

describe('Navbar', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('class');
    document.documentElement.removeAttribute('style');
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

  it('toggles dark mode through the theme provider and remembers the choice', () => {
    renderNavbar();

    userEvent.click(screen.getByLabelText('Toggle theme'));
    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem('theme')).toBe('dark');

    userEvent.click(screen.getByLabelText('Toggle theme'));
    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');
    expect(document.documentElement).not.toHaveClass('dark');
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('restores a dark choice saved before the provider was introduced', () => {
    localStorage.setItem('theme', 'dark');
    const { container } = renderNavbar();

    expect(document.documentElement).toHaveClass('dark');
    expect(container.querySelector('.lucide-sun')).toBeInTheDocument();

    userEvent.click(screen.getByLabelText('Toggle theme'));
    expect(document.documentElement).not.toHaveClass('dark');
    expect(localStorage.getItem('theme')).toBe('light');
  });
});
