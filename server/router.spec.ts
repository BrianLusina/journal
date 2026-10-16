import { mkdirSync, mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { discoverRoutes, matchRoute } from './router';

/** An api/ directory holding the given files. */
const apiDirWith = (files: string[]): string => {
  const apiDir = mkdtempSync(path.join(tmpdir(), 'api-'));
  files.forEach(file => {
    mkdirSync(path.dirname(path.join(apiDir, file)), { recursive: true });
    writeFileSync(path.join(apiDir, file), 'export default () => undefined;');
  });
  return apiDir;
};

describe('api router', () => {
  it('serves each handler file at its path, without the extension', () => {
    const apiDir = apiDirWith(['notion/posts.ts', 'contact.js']);
    const routes = discoverRoutes(apiDir);

    expect(matchRoute(routes, '/api/notion/posts')).toEqual({
      file: path.join(apiDir, 'notion/posts.ts'),
      params: {},
    });
    expect(matchRoute(routes, '/api/contact')).toEqual({
      file: path.join(apiDir, 'contact.js'),
      params: {},
    });
  });

  it('passes a [name] segment to the handler as a decoded param', () => {
    const apiDir = apiDirWith(['notion/posts/[slug].ts']);

    expect(matchRoute(discoverRoutes(apiDir), '/api/notion/posts/hello%20world')).toEqual({
      file: path.join(apiDir, 'notion/posts/[slug].ts'),
      params: { slug: 'hello world' },
    });
  });

  it('prefers a static segment over a dynamic one, whichever file is found first', () => {
    const apiDir = apiDirWith(['posts/[slug].ts', 'posts/latest.ts']);
    const routes = discoverRoutes(apiDir);

    expect(matchRoute(routes, '/api/posts/latest')?.file).toBe(path.join(apiDir, 'posts/latest.ts'));
    expect(matchRoute(routes, '/api/posts/other')?.file).toBe(path.join(apiDir, 'posts/[slug].ts'));
  });

  it('does not route files or directories starting with _, specs or type declarations', () => {
    const apiDir = apiDirWith([
      'notion/_shared.ts',
      '_lib/helper.ts',
      'notion/posts.spec.ts',
      'notion/posts.test.js',
      'types.d.ts',
    ]);

    expect(discoverRoutes(apiDir)).toEqual([]);
  });

  it('matches nothing for an unknown path, an /api path too short or too long, or a non-/api path', () => {
    const apiDir = apiDirWith(['notion/posts.ts', 'notion/posts/[slug].ts']);
    const routes = discoverRoutes(apiDir);

    expect(matchRoute(routes, '/api/notion/unknown')).toBeUndefined();
    expect(matchRoute(routes, '/api/notion')).toBeUndefined();
    expect(matchRoute(routes, '/api/notion/posts/slug/extra')).toBeUndefined();
    expect(matchRoute(routes, '/api/notion/_shared')).toBeUndefined();
    expect(matchRoute(routes, '/notion/posts')).toBeUndefined();
  });

  it('matches nothing for a malformed percent-encoding', () => {
    const routes = discoverRoutes(apiDirWith(['notion/posts/[slug].ts']));

    expect(matchRoute(routes, '/api/notion/posts/%E0%A4%A')).toBeUndefined();
  });

  it('routes the Notion functions in this repository', () => {
    const apiDir = path.resolve(__dirname, '..', 'api');
    const routes = discoverRoutes(apiDir);

    expect(matchRoute(routes, '/api/notion/posts')?.file).toBe(path.join(apiDir, 'notion/posts.ts'));
    expect(matchRoute(routes, '/api/notion/posts/my-post')).toEqual({
      file: path.join(apiDir, 'notion/posts/[slug].ts'),
      params: { slug: 'my-post' },
    });
  });
});
