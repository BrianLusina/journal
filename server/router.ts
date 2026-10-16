import { readdirSync } from 'fs';
import path from 'path';

/** A function in api/: the URL segments after /api it serves, and its file. */
export interface Route {
  segments: string[];
  file: string;
}

const HANDLER = /\.(ts|js)$/;
const NOT_A_HANDLER = /\.(d|spec|test)\.(ts|js)$/;
const DYNAMIC = /^\[(\w+)\]$/;

const dynamicCount = (route: Route) => route.segments.filter(segment => DYNAMIC.test(segment)).length;

/**
 * The functions in apiDir, by Vercel's file-system routing: api/a/b.ts serves /api/a/b,
 * api/a/[id].ts serves /api/a/:id, and a file or directory starting with _ is not a route.
 * Specs and type declarations are not functions either. Static routes come before dynamic ones.
 */
export function discoverRoutes(apiDir: string): Route[] {
  return readdirSync(apiDir, { recursive: true, encoding: 'utf8' })
    .filter(file => HANDLER.test(file) && !NOT_A_HANDLER.test(file))
    .map(file => file.split(path.sep))
    .filter(parts => !parts.some(part => part.startsWith('_')))
    .map(parts => ({
      segments: [...parts.slice(0, -1), parts[parts.length - 1].replace(HANDLER, '')],
      file: path.join(apiDir, ...parts),
    }))
    .sort((a, b) => dynamicCount(a) - dynamicCount(b));
}

/** The decoded segments of an /api/... pathname after /api, or undefined for any other path. */
const apiSegments = (pathname: string): string[] | undefined => {
  const [prefix, ...segments] = pathname.split('/').filter(Boolean);
  if (prefix !== 'api') return undefined;
  try {
    return segments.map(decodeURIComponent);
  } catch {
    return undefined;
  }
};

/** The route that serves pathname, with the values of its dynamic segments. */
export function matchRoute(
  routes: Route[],
  pathname: string,
): { file: string; params: Record<string, string> } | undefined {
  const segments = apiSegments(pathname);
  if (!segments) return undefined;

  for (const route of routes) {
    if (route.segments.length !== segments.length) continue;
    const params: Record<string, string> = {};
    const matches = route.segments.every((segment, index) => {
      const name = DYNAMIC.exec(segment)?.[1];
      if (name) params[name] = segments[index];
      return name !== undefined || segment === segments[index];
    });
    if (matches) return { file: route.file, params };
  }
  return undefined;
}
