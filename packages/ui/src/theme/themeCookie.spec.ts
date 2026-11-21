import { readThemeCookie, serializeThemeCookie, themeCookieDomain } from './themeCookie';

describe('themeCookieDomain', () => {
  it.each(['brianlusina.com', 'folio.brianlusina.com', 'staging.blog.brianlusina.com'])(
    'shares the choice across brianlusina.com from %s',
    hostname => expect(themeCookieDomain(hostname)).toBe('.brianlusina.com'),
  );

  // A Domain the browser won't accept for the host makes it drop the cookie: previews and local
  // hosts keep the choice on their own host instead.
  it.each(['journal-abc.vercel.app', 'localhost', 'folio.localhost', 'notbrianlusina.com'])(
    'keeps the cookie on %s alone',
    hostname => expect(themeCookieDomain(hostname)).toBeUndefined(),
  );
});

describe('serializeThemeCookie', () => {
  it('shares a secure cookie across the sites in production', () => {
    const cookie = serializeThemeCookie('dark', { hostname: 'folio.brianlusina.com', protocol: 'https:' });

    expect(cookie).toBe('theme=dark; Path=/; Max-Age=31536000; SameSite=Lax; Domain=.brianlusina.com; Secure');
  });

  it('writes a host-only, non-secure cookie on http://localhost', () => {
    const cookie = serializeThemeCookie('light', { hostname: 'localhost', protocol: 'http:' });

    expect(cookie).toBe('theme=light; Path=/; Max-Age=31536000; SameSite=Lax');
  });
});

describe('readThemeCookie', () => {
  it('reads the theme among other cookies', () => {
    expect(readThemeCookie('a=1; theme=dark; b=2')).toBe('dark');
  });

  it.each(['theme=purple', '', 'themes=dark'])('ignores %p', cookie => {
    expect(readThemeCookie(cookie)).toBeUndefined();
  });
});
