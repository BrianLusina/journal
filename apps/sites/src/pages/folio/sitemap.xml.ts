import type { APIRoute } from 'astro';
import { registry } from '../../sites/current';
import { sitemapXml } from '../../seo/sitemap';

export const GET: APIRoute = () =>
  new Response(sitemapXml('folio', registry), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
