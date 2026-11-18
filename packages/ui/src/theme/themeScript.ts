/**
 * Inline this in <head>, before any stylesheet paints, so the page never flashes the wrong theme
 * (#829). It applies the `dark` class the Tailwind preset reads: from the theme cookie when the
 * reader chose one, otherwise from the system preference. It is self-contained (no imports) and
 * swallows every error, since a throw here would skip the rest of the inline script.
 */
export const themeScript = `(function () {
  try {
    var match = document.cookie.match(/(?:^|;\\s*)theme=([^;]*)/);
    var saved = match ? match[1] : '';
    var dark = saved === 'dark' || (saved !== 'light' && !!window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();`;
