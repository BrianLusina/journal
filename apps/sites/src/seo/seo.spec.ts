import { loadRegistry } from '../sites/registry';
import { robotsTxt } from './robots';
import { sitemapXml } from './sitemap';

const registry = loadRegistry({});

describe('robotsTxt', () => {
  it('opens a production site to crawlers and points at its sitemap', () => {
    expect(robotsTxt('folio', true, registry)).toBe(
      'User-agent: *\nAllow: /\nSitemap: https://folio.brianlusina.com/sitemap.xml\n',
    );
  });

  it('closes every other environment', () => {
    expect(robotsTxt('folio', false, registry)).toBe('User-agent: *\nDisallow: /\n');
  });
});

describe('sitemapXml', () => {
  it("lists the site's routes on its production host only", () => {
    const xml = sitemapXml('folio', registry);

    expect(xml).toContain('<loc>https://folio.brianlusina.com/</loc>');
    expect(xml).not.toContain('://brianlusina.com');
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
  });
});
