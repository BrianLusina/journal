const SHARED_DOMAIN = 'brianlusina.com';

/**
 * A cookie Domain for the whole of brianlusina.com, so a choice made on one site carries to the
 * others. Anywhere else (previews on vercel.app, localhost, a Docker host) a browser rejects that
 * Domain and drops the cookie, so the cookie stays on the current host instead.
 */
export function sharedCookieDomain(hostname: string): string | undefined {
  return hostname === SHARED_DOMAIN || hostname.endsWith(`.${SHARED_DOMAIN}`) ? `.${SHARED_DOMAIN}` : undefined;
}
