import { themeScript } from './themeScript';

const run = ({ cookie, systemDark }: { cookie: string; systemDark?: boolean }) => {
  document.documentElement.className = '';
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

  it('never throws, and stays light, where matchMedia is missing', () => {
    expect(() => run({ cookie: '' })).not.toThrow();
    expect(run({ cookie: '' })).toBe(false);
  });
});
