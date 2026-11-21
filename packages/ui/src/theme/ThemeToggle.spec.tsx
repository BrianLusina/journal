import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  let written: string[];

  beforeEach(() => {
    written = [];
    document.documentElement.className = '';
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => '',
      set: (value: string) => written.push(value),
    });
  });

  it('switches between dark and light, and remembers each choice in the theme cookie', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: 'Toggle theme' });

    fireEvent.click(button);
    expect(document.documentElement).toHaveClass('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(written.at(-1)).toMatch(/^theme=dark;/);

    fireEvent.click(button);
    expect(document.documentElement).not.toHaveClass('dark');
    expect(document.documentElement.style.colorScheme).toBe('light');
    expect(written.at(-1)).toMatch(/^theme=light;/);
  });

  it('starts from the theme the page already has', () => {
    document.documentElement.classList.add('dark');
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle theme' }));

    expect(document.documentElement).not.toHaveClass('dark');
    expect(written.at(-1)).toMatch(/^theme=light;/);
  });
});
