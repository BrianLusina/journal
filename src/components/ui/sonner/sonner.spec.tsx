import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAppWithRouter from '@testUtils/MockAppWithRouter';
import ThemeProvider from '@providers/theme/ThemeProvider';
import Navbar from '@/components/Navbar/Navbar';
import { Toaster, toast } from './sonner';

const toasterTheme = () =>
  document.querySelector('[data-sonner-toaster]')?.getAttribute('data-theme');

describe('Toaster', () => {
  beforeEach(() => {
    // The OS prefers light: setupTests mocks matchMedia to never match.
    localStorage.clear();
    document.documentElement.removeAttribute('class');
    document.documentElement.removeAttribute('style');
  });

  it("uses the provider's resolved theme rather than the OS preference", async () => {
    localStorage.setItem('theme', 'dark');
    render(
      <ThemeProvider>
        <Toaster />
      </ThemeProvider>,
    );

    act(() => {
      toast('Saved');
    });

    expect(await screen.findByText('Saved')).toBeInTheDocument();
    expect(toasterTheme()).toBe('dark');
  });

  it('follows the theme the reader picks in the navbar', async () => {
    render(
      <ThemeProvider>
        <MockAppWithRouter>
          <Navbar />
        </MockAppWithRouter>
        <Toaster />
      </ThemeProvider>,
    );

    userEvent.click(screen.getByLabelText('Toggle theme'));
    act(() => {
      toast('Saved');
    });

    expect(await screen.findByText('Saved')).toBeInTheDocument();
    expect(document.documentElement).toHaveClass('dark');
    expect(toasterTheme()).toBe('dark');
  });
});
