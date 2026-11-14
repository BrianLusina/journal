import { type ChildProcess, spawn } from 'child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'fs';
import http from 'http';
import { tmpdir } from 'os';
import path from 'path';
import { injectEnv } from './envScript';

const indexHtml = readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

// Runs the server with Bun, as the image does, over a small dist/ and api/ of its own.
const root = mkdtempSync(path.join(tmpdir(), 'server-'));
const port = 20000 + Math.floor(Math.random() * 20000);
let server: ChildProcess;

const write = (file: string, content: string) => {
  mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  writeFileSync(path.join(root, file), content);
};

type Answer = { status: number; headers: http.IncomingHttpHeaders; body: string };

const get = (pathname: string): Promise<Answer> =>
  new Promise((resolve, reject) => {
    http
      .get({ host: '127.0.0.1', port, path: pathname }, response => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', chunk => {
          body += chunk;
        });
        response.on('end', () => resolve({ status: response.statusCode as number, headers: response.headers, body }));
      })
      .on('error', reject);
  });

beforeAll(async () => {
  ['index.ts', 'adapter.ts', 'router.ts', 'envScript.ts'].forEach(file => {
    mkdirSync(path.join(root, 'server'), { recursive: true });
    copyFileSync(path.join(__dirname, file), path.join(root, 'server', file));
  });
  write('dist/index.html', indexHtml);
  write('dist/assets/index-abc12345.js', 'console.log(1);');
  write('dist/assets/icons/icon.png', 'png');
  write('secret.txt', 'outside dist');
  write('api/hello/[name].ts', 'export default (req, res) => res.json({ name: req.query.name });');
  write('api/_private.ts', 'export default (req, res) => res.json({ private: true });');
  write('api/broken.ts', 'throw new Error("cannot load");\nexport default () => undefined;');

  server = spawn('bun', ['server/index.ts'], {
    cwd: root,
    env: { ...process.env, PORT: String(port), VITE_APP_TITLE: 'Journal', NOTION_API_KEY: 'secret' },
  });
  await new Promise<void>((resolve, reject) => {
    server.stdout?.on('data', data => String(data).includes('Listening') && resolve());
    server.on('exit', code => reject(new Error(`server exited with ${code}`)));
  });
}, 20000);

afterAll(() => {
  server?.kill();
});

describe('Docker image server', () => {
  it('answers /healthz', async () => {
    expect(await get('/healthz')).toMatchObject({ status: 200, body: 'ok' });
  });

  it('serves index.html with the allowlisted VITE_ variables set, uncached, for the app and its routes', async () => {
    for (const pathname of ['/', '/index.html', '/article/tag/react']) {
      const answer = await get(pathname);

      expect(answer).toMatchObject({ status: 200, body: injectEnv(indexHtml, { VITE_APP_TITLE: 'Journal' }) });
      expect(answer.body).toContain('window.__ENV__ = {"VITE_APP_TITLE":"Journal"};');
      expect(answer.body).not.toContain('secret');
      expect(answer.headers['content-type']).toMatch(/^text\/html/);
      expect(answer.headers['cache-control']).toBe('no-cache');
    }
  });

  it('no longer serves a separate /env.js', async () => {
    expect((await get('/env.js')).headers['content-type']).toMatch(/^text\/html/);
  });

  it('caches hashed assets for a year, but not the unhashed files in public/assets/', async () => {
    const hashed = await get('/assets/index-abc12345.js');
    const icon = await get('/assets/icons/icon.png');

    expect(hashed).toMatchObject({ status: 200, body: 'console.log(1);' });
    expect(hashed.headers['cache-control']).toBe('public, max-age=31536000, immutable');
    expect(icon.status).toBe(200);
    expect(icon.headers['cache-control']).toBeUndefined();
  });

  it('answers 404 for a missing asset rather than the app', async () => {
    expect((await get('/assets/index-gone0000.js')).status).toBe(404);
  });

  it('never serves a file outside dist/', async () => {
    const answer = await get('/..%2fsecret.txt');

    expect(answer.body).not.toContain('outside dist');
  });

  it('runs the api/ function for the path, with its dynamic segment', async () => {
    const answer = await get('/api/hello/world');

    expect(answer.status).toBe(200);
    expect(JSON.parse(answer.body)).toEqual({ name: 'world' });
  });

  it('answers a JSON 404 for an unknown /api path or a _ file', async () => {
    for (const pathname of ['/api/unknown', '/api/_private']) {
      const answer = await get(pathname);

      expect(answer.status).toBe(404);
      expect(JSON.parse(answer.body)).toEqual({ error: 'Not found' });
    }
  });

  it('answers a JSON 500 when a function fails to load', async () => {
    const answer = await get('/api/broken');

    expect(answer.status).toBe(500);
    expect(JSON.parse(answer.body)).toEqual({ error: 'Internal server error' });
  });
});
