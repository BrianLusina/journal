import { loadRegistry } from './registry';
import { canonicalUrl, siteUrl } from './urls';

const registry = loadRegistry({});

describe('siteUrl', () => {
  it('links to the same environment of another app', () => {
    expect(siteUrl('blog', '/article/1/x', { env: 'staging', origin: 'https://staging.brianlusina.com' }, registry)).toBe(
      'https://staging.blog.brianlusina.com/article/1/x',
    );
  });

  it('stays on a preview, switching site with ?site=', () => {
    expect(siteUrl('folio', '/', { env: 'preview', origin: 'https://journal-x.vercel.app' }, registry)).toBe(
      'https://journal-x.vercel.app/?site=folio',
    );
  });

  it('links from a preview to the staging blog', () => {
    expect(siteUrl('blog', '/', { env: 'preview', origin: 'https://journal-x.vercel.app' }, registry)).toBe(
      'https://staging.blog.brianlusina.com/',
    );
  });

  it('uses http locally', () => {
    expect(siteUrl('folio', '/p', { env: 'development', origin: 'http://localhost:4321' }, registry)).toBe(
      'http://folio.localhost:4321/p',
    );
  });
});

describe('canonicalUrl', () => {
  it('always names the production host', () => {
    expect(canonicalUrl('folio', '/p', registry)).toBe('https://folio.brianlusina.com/p');
  });
});
