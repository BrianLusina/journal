export type Theme = 'light' | 'dark';

/** The reader's light/dark choice, shared by every site on brianlusina.com. */
export const THEME_COOKIE = 'theme';

const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;
const SHARED_DOMAIN = 'brianlusina.com';

/**
 * The cookie's Domain: the whole of brianlusina.com, so a choice made on one site carries to the
 * others. Anywhere else (previews on vercel.app, localhost, a Docker host) a browser rejects that
 * Domain and drops the cookie, so it stays on the current host instead.
 */
export function themeCookieDomain(hostname: string): string | undefined {
  return hostname === SHARED_DOMAIN || hostname.endsWith(`.${SHARED_DOMAIN}`) ? `.${SHARED_DOMAIN}` : undefined;
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
