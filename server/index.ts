/**
 * The Docker image's web server: the app in dist/, the functions in api/ and /env.js, the way
 * Vercel serves them. Run it after `bun run build` with `bun server/index.ts`; the image runs the
 * bundle `bun server/build.ts` makes of it.
 */
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { invoke, type Handler } from './adapter';
import { renderEnvScript } from './envScript';
import { discoverRoutes, matchRoute } from './router';

// dist/ and api/ sit next to server/, both in the repository and in the image.
const root = path.resolve(import.meta.dirname, '..');
const distDir = path.join(root, 'dist');
const routes = discoverRoutes(path.join(root, 'api'));
const envScript = renderEnvScript(process.env);

const NO_CACHE = { 'Cache-Control': 'no-cache' };
// Vite writes its content-hashed output straight into dist/assets/; public/assets/ only has
// subdirectories, whose files are not hashed.
const isHashedAsset = (pathname: string) => /^\/assets\/[^/]+$/.test(pathname);

async function serveApi(request: Request, pathname: string): Promise<Response> {
  const route = matchRoute(routes, pathname);
  if (!route) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  const { default: handler } = (await import(route.file)) as { default: Handler };
  const { status, headers, body } = await invoke(handler, request, route.params);
  return new Response(body, { status, headers });
}

/** The file in dist/ that pathname names, if there is one. */
async function findFile(pathname: string): Promise<string | undefined> {
  let file: string;
  try {
    file = path.join(distDir, decodeURIComponent(pathname));
  } catch {
    return undefined;
  }
  if (!file.startsWith(distDir + path.sep)) {
    return undefined;
  }
  const stats = await stat(file).catch(() => undefined);
  return stats?.isFile() ? file : undefined;
}

async function handle(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url);

  if (pathname === '/healthz') {
    return new Response('ok');
  }
  if (pathname === '/env.js') {
    return new Response(envScript, {
      headers: { 'Content-Type': 'text/javascript; charset=utf-8', ...NO_CACHE },
    });
  }
  if (pathname === '/api' || pathname.startsWith('/api/')) {
    return serveApi(request, pathname);
  }

  const file = await findFile(pathname);
  if (file) {
    const cacheControl = isHashedAsset(pathname)
      ? { 'Cache-Control': 'public, max-age=31536000, immutable' }
      : file.endsWith('.html') ? NO_CACHE : undefined;
    return new Response(Bun.file(file), { headers: cacheControl });
  }
  // A missing asset is a 404, not the app: a stale chunk must fail to load, not parse HTML.
  if (pathname.startsWith('/assets/')) {
    return new Response('Not found', { status: 404 });
  }
  // Any other path is a route of the single-page app.
  return new Response(Bun.file(path.join(distDir, 'index.html')), { headers: NO_CACHE });
}

const server = Bun.serve({
  port: Number(process.env.PORT) || 8080,
  // Bun closes a connection idle for 10 s by default, which a slow Notion request can reach.
  idleTimeout: 60,
  fetch: handle,
});
console.log(`Listening on port ${server.port}`);
