/**
 * Inline this in <head>, before any stylesheet paints, so the page never flashes the wrong theme
 * (#829). It applies the `dark` class the Tailwind preset reads, and the matching `color-scheme` so
 * scrollbars and form controls follow: from the theme cookie when the reader chose one, otherwise
 * from the system preference, which it then keeps following until the reader chooses (as next-themes
 * does on the blog). It is self-contained (no imports) and swallows every error, since a throw here
 * would skip the rest of the inline script.
 */
export const themeScript = `(function () {
  try {
    var root = document.documentElement;
    var saved = function () {
      var match = document.cookie.match(/(?:^|;\\s*)theme=([^;]*)/);
      var value = match ? match[1] : '';
      return value === 'light' || value === 'dark' ? value : '';
    };
    var apply = function (dark) {
      root.classList.toggle('dark', dark);
      root.style.colorScheme = dark ? 'dark' : 'light';
    };
    var system = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    var choice = saved();
    apply(choice ? choice === 'dark' : !!(system && system.matches));
    if (system && system.addEventListener) {
      system.addEventListener('change', function (event) {
        if (!saved()) apply(event.matches);
      });
    }
  } catch (e) {}
})();`;
