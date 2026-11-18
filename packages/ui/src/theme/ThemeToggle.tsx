import { useEffect, useState, type FC } from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '../lib/utils';
import { serializeThemeCookie } from './themeCookie';

/**
 * The light/dark switch, as the blog's navbar draws it. It flips the `dark` class on <html> and
 * saves the choice in the shared theme cookie; themeScript applies that choice on the next page.
 */
export const ThemeToggle: FC<{ className?: string }> = ({ className }) => {
  // Read after mount: during server rendering there is no document, and themeScript has already
  // set the class before hydration.
  const [isDark, setIsDark] = useState(false);
  useEffect(() => setIsDark(document.documentElement.classList.contains('dark')), []);

  const toggle = () => {
    const next = !isDark;
    document.documentElement.classList.toggle('dark', next);
    document.cookie = serializeThemeCookie(next ? 'dark' : 'light', window.location);
    setIsDark(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn('p-1.5 sm:p-2 rounded-full hover:bg-muted/60 transition-all', className)}
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
    </button>
  );
};
