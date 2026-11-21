import type { APIRoute } from 'astro';
import { registry } from '../../sites/current';
import { robotsTxt } from '../../seo/robots';

export const GET: APIRoute = ({ locals }) =>
  new Response(robotsTxt('folio', locals.site?.env === 'production', registry), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
