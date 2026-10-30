import { execFileSync } from 'child_process';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { CLIENT_ENV_KEYS, injectEnv } from './envScript';

const repoRoot = path.resolve(__dirname, '..');
const indexHtml = readFileSync(path.join(repoRoot, 'index.html'), 'utf8');

/** Runs the page's inline scripts in a fake window and returns the window.__ENV__ they set. */
const runInlineScripts = (html: string): Record<string, string> => {
  const fakeWindow: { __ENV__?: Record<string, string> } = {};
  // Parsed as the browser would, so a value that closes the script shows up as a broken script.
  new DOMParser()
    .parseFromString(html, 'text/html')
    .querySelectorAll('script:not([src])')
    .forEach(script => new Function('window', script.textContent ?? '')(fakeWindow));
  return fakeWindow.__ENV__ as Record<string, string>;
};

describe('runtime configuration in index.html', () => {
  it('sets window.__ENV__ to the allowlisted VITE_ variables that are set', () => {
    const html = injectEnv(indexHtml, {
      VITE_APP_TITLE: 'Journal',
      VITE_FIREBASE_PROJECT_ID: 'journal-prod',
    });

    expect(runInlineScripts(html)).toEqual({
      VITE_APP_TITLE: 'Journal',
      VITE_FIREBASE_PROJECT_ID: 'journal-prod',
    });
  });

  it('never exposes a variable outside the allowlist, VITE_ or not', () => {
    const html = injectEnv(indexHtml, {
      VITE_APP_TITLE: 'Journal',
      VITE_NOT_ALLOWLISTED: 'leak',
      NOTION_API_KEY: 'secret',
      RESEND_API_KEY: 'secret',
      PATH: '/usr/bin',
    });

    expect(runInlineScripts(html)).toEqual({ VITE_APP_TITLE: 'Journal' });
    expect(html).not.toMatch(/leak|secret|usr\/bin/);
  });

  it('allowlists VITE_ variables only', () => {
    expect(CLIENT_ENV_KEYS.filter(key => !key.startsWith('VITE_'))).toEqual([]);
  });

  it('escapes values so none can close the script element or break out of the string', () => {
    const value = '</script><script>window.__ENV__.HACKED = "1"</script><!--"\'\u2028\\';
    const html = injectEnv(indexHtml, { VITE_APP_TITLE: value });

    expect(html.match(/<\/script>/g)).toHaveLength((indexHtml.match(/<\/script>/g) ?? []).length);
    expect(html).not.toContain('\u2028');
    expect(runInlineScripts(html)).toEqual({ VITE_APP_TITLE: value });
  });

  it('leaves window.__ENV__ empty without runtime variables, or where nothing replaces the placeholder', () => {
    expect(runInlineScripts(injectEnv(indexHtml, {}))).toEqual({});
    // Vercel serves index.html as Vite built it.
    expect(runInlineScripts(indexHtml)).toEqual({});
  });

  it('fails without the placeholder, rather than serving the page unconfigured', () => {
    expect(() => injectEnv('<!doctype html><title>app</title>', {})).toThrow(/__RUNTIME_ENV__/);
  });

  it('keeps the placeholder through vite build', () => {
    const project = mkdtempSync(path.join(tmpdir(), 'vite-'));
    writeFileSync(path.join(project, 'index.html'), indexHtml.replace('/src/main.tsx', '/main.js'));
    writeFileSync(path.join(project, 'main.js'), 'console.log(window.__ENV__);');

    execFileSync(path.join(repoRoot, 'node_modules', '.bin', 'vite'), ['build', '--logLevel', 'error'], {
      cwd: project,
    });
    const built = readFileSync(path.join(project, 'dist', 'index.html'), 'utf8');

    expect(runInlineScripts(injectEnv(built, { VITE_APP_TITLE: 'Journal' }))).toEqual({
      VITE_APP_TITLE: 'Journal',
    });
  }, 30000);

  // The allowlist must name every VITE_ value the app reads at runtime, and nothing more.
  it('allowlists exactly the keys src/config reads with readEnv', () => {
    const configDir = path.resolve(__dirname, '..', 'src', 'config');
    const read = (file: string) => readFileSync(path.join(configDir, file), 'utf8');
    const configSources = readdirSync(configDir)
      .filter(file => file.endsWith('.ts') && !file.endsWith('.spec.ts') && file !== 'runtimeEnv.ts')
      .map(read);
    const keysRead = configSources.flatMap(source =>
      [...source.matchAll(/readEnv\('(VITE_\w+)'\)/g)].map(match => match[1]),
    );
    const buildTimeKeys = [...read('runtimeEnv.ts').matchAll(/import\.meta\.env\.(VITE_\w+)/g)].map(
      match => match[1],
    );

    expect([...new Set(keysRead)].sort()).toEqual([...CLIENT_ENV_KEYS].sort());
    expect([...new Set(buildTimeKeys)].sort()).toEqual([...CLIENT_ENV_KEYS].sort());
    // A value read straight from import.meta.env would be fixed at build time in the image.
    expect(configSources.join('\n')).not.toMatch(/import\.meta\.env\.VITE_/);
  });
});
