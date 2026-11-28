import { sharedCookieDomain } from '../lib/sharedCookieDomain';

export type Consent = 'granted' | 'denied';

/** The reader's analytics choice, shared by every site on brianlusina.com. */
export const CONSENT_COOKIE = 'consent';

const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

export function serializeConsentCookie(consent: Consent, location: { hostname: string; protocol: string }): string {
  const domain = sharedCookieDomain(location.hostname);
  return [
    `${CONSENT_COOKIE}=${consent}`,
    'Path=/',
    `Max-Age=${ONE_YEAR_SECONDS}`,
    'SameSite=Lax',
    ...(domain ? [`Domain=${domain}`] : []),
    ...(location.protocol === 'https:' ? ['Secure'] : []),
  ].join('; ');
}

/**
 * The saved choice, or undefined when there is none, or it is anything but exactly granted or
 * denied, or two cookies disagree. Undefined means the reader is asked again, and nothing loads.
 */
export function readConsentCookie(cookie: string): Consent | undefined {
  const values = new Set(
    cookie
      .split(';')
      .map(part => part.trim())
      .filter(part => part.startsWith(`${CONSENT_COOKIE}=`))
      .map(part => part.slice(CONSENT_COOKIE.length + 1)),
  );
  if (values.size !== 1) return undefined;
  const [value] = values;
  return value === 'granted' || value === 'denied' ? value : undefined;
}
