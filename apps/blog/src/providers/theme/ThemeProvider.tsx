import { FunctionComponent, PropsWithChildren } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

/**
 * Single source of the reader's light/dark choice, used by the Navbar toggle and the toasts.
 * It toggles the `dark` class that Tailwind reads and keeps the `localStorage.theme` key the
 * Navbar used before, so a reader's earlier choice carries over.
 */
const ThemeProvider: FunctionComponent<PropsWithChildren> = ({ children }) => (
  <NextThemesProvider attribute="class" storageKey="theme">
    {children}
  </NextThemesProvider>
);

export default ThemeProvider;
