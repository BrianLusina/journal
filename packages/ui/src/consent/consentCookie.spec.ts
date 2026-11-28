import { CONSENT_COOKIE, readConsentCookie, serializeConsentCookie } from './consentCookie';

describe('the consent cookie', () => {
  it.each(['granted', 'denied'] as const)('round-trips %s', consent => {
    const cookie = serializeConsentCookie(consent, { hostname: 'brianlusina.com', protocol: 'https:' });

    expect(cookie.split(';')[0]).toBe(`${CONSENT_COOKIE}=${consent}`);
    expect(readConsentCookie(cookie.split(';')[0])).toBe(consent);
  });

  it('is shared across brianlusina.com, for a year, Secure on https', () => {
    expect(serializeConsentCookie('granted', { hostname: 'folio.brianlusina.com', protocol: 'https:' })).toBe(
      'consent=granted; Path=/; Max-Age=31536000; SameSite=Lax; Domain=.brianlusina.com; Secure',
    );
  });

  it.each(['yggdrasil-git-x-lusinabrian.vercel.app', 'localhost'])('stays on %s', hostname => {
    expect(serializeConsentCookie('denied', { hostname, protocol: 'http:' })).toBe('consent=denied; Path=/; Max-Age=31536000; SameSite=Lax');
  });

  it.each([
    ['no cookie', ''],
    ['another cookie', 'theme=dark'],
    ['an unknown value', 'consent=yes'],
    ['a different case', 'consent=GRANTED'],
    ['two conflicting values', 'consent=granted; consent=denied'],
  ])('reads %s as no choice yet', (_, cookie) => {
    expect(readConsentCookie(cookie)).toBeUndefined();
  });

  it('reads the choice among other cookies', () => {
    expect(readConsentCookie('theme=dark; consent=granted; site=home')).toBe('granted');
  });
});
