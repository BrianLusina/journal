import { themeScript } from './themeScript';

const run = ({ cookie, systemDark }: { cookie: string; systemDark?: boolean }) => {
  document.documentElement.className = '';
  document.documentElement.style.colorScheme = '';
  Object.defineProperty(document, 'cookie', { configurable: true, get: () => cookie });
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value:
      systemDark === undefined
        ? undefined
        : (query: string) => ({ matches: systemDark && query === '(prefers-color-scheme: dark)' }),
  });
  new Function(themeScript)();
  return document.documentElement.classList.contains('dark');
};

describe('themeScript, run in <head> before the page paints', () => {
  it('applies a dark choice', () => expect(run({ cookie: 'theme=dark', systemDark: false })).toBe(true));

  it('keeps a light choice on a dark system', () => expect(run({ cookie: 'theme=light', systemDark: true })).toBe(false));

  it('follows a dark system without a choice', () => expect(run({ cookie: '', systemDark: true })).toBe(true));

  it('follows the system when the cookie holds anything else', () =>
    expect(run({ cookie: 'theme=%%%', systemDark: true })).toBe(true));

  // Scrollbars, form controls and autofill follow color-scheme, as next-themes sets it on the blog.
  it('sets the color scheme native controls are drawn in', () => {
    run({ cookie: 'theme=dark', systemDark: false });
    expect(document.documentElement.style.colorScheme).toBe('dark');

    run({ cookie: 'theme=light', systemDark: true });
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  // As next-themes does on the blog: with no choice saved, an OS switch at sunset applies at once.
  describe('while following the system', () => {
    const runWithLiveSystem = (cookie: string) => {
      let listener: ((event: { matches: boolean }) => void) | undefined;
      document.documentElement.className = '';
      Object.defineProperty(document, 'cookie', { configurable: true, get: () => cookie });
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: () => ({ matches: false, addEventListener: (_: string, fn: typeof listener) => (listener = fn) }),
      });
      new Function(themeScript)();
      return (dark: boolean) => listener?.({ matches: dark });
    };

    it('applies a change of system theme without a reload', () => {
      const systemChangesTo = runWithLiveSystem('');

      systemChangesTo(true);

      expect(document.documentElement).toHaveClass('dark');
      expect(document.documentElement.style.colorScheme).toBe('dark');
    });

    it('ignores the system once the reader has chosen', () => {
      const systemChangesTo = runWithLiveSystem('theme=light');

      systemChangesTo(true);

      expect(document.documentElement).not.toHaveClass('dark');
    });
  });

  it('never throws, and stays light, where matchMedia is missing', () => {
    expect(() => run({ cookie: '' })).not.toThrow();
    expect(run({ cookie: '' })).toBe(false);
  });
});
