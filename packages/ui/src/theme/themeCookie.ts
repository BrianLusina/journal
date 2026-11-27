import { sharedCookieDomain } from '../lib/sharedCookieDomain';

export type Theme = 'light' | 'dark';

/** The reader's light/dark choice, shared by every site on brianlusina.com. */
export const THEME_COOKIE = 'theme';

const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;
/** The cookie's Domain: see sharedCookieDomain. */
export function themeCookieDomain(hostname: string): string | undefined {
  return sharedCookieDomain(hostname);
}

export function serializeThemeCookie(theme: Theme, location: { hostname: string; protocol: string }): string {
  const domain = themeCookieDomain(location.hostname);
  return [
    `${THEME_COOKIE}=${theme}`,
    'Path=/',
    `Max-Age=${ONE_YEAR_SECONDS}`,
    'SameSite=Lax',
    ...(domain ? [`Domain=${domain}`] : []),
    ...(location.protocol === 'https:' ? ['Secure'] : []),
  ].join('; ');
}

/** The saved choice, or undefined when there is none or it holds anything but light or dark. */
export function readThemeCookie(cookie: string): Theme | undefined {
  const value = cookie
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith(`${THEME_COOKIE}=`))
    ?.slice(THEME_COOKIE.length + 1);
  return value === 'light' || value === 'dark' ? value : undefined;
}
