import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import { CLIENT_ENV_KEYS, renderEnvScript } from './envScript';

/** Runs the generated /env.js and returns the window.__ENV__ it sets. */
const run = (script: string): Record<string, string> => {
  const fakeWindow: { __ENV__?: Record<string, string> } = {};
  new Function('window', script)(fakeWindow);
  return fakeWindow.__ENV__ as Record<string, string>;
};

describe('/env.js', () => {
  it('sets window.__ENV__ to the allowlisted VITE_ variables that are set', () => {
    const script = renderEnvScript({
      VITE_APP_TITLE: 'Journal',
      VITE_FIREBASE_PROJECT_ID: 'journal-prod',
    });

    expect(run(script)).toEqual({ VITE_APP_TITLE: 'Journal', VITE_FIREBASE_PROJECT_ID: 'journal-prod' });
  });

  it('never exposes a variable outside the allowlist, VITE_ or not', () => {
    const script = renderEnvScript({
      VITE_APP_TITLE: 'Journal',
      VITE_NOT_ALLOWLISTED: 'leak',
      NOTION_API_KEY: 'secret',
      RESEND_API_KEY: 'secret',
      PATH: '/usr/bin',
    });

    expect(run(script)).toEqual({ VITE_APP_TITLE: 'Journal' });
    expect(script).not.toMatch(/leak|secret|usr/);
  });

  it('allowlists VITE_ variables only', () => {
    expect(CLIENT_ENV_KEYS.filter(key => !key.startsWith('VITE_'))).toEqual([]);
  });

  it('escapes values so none can close a script element or break out of the string', () => {
    const value = '</script><script>alert(1)</script>"\'\u2028\\';
    const script = renderEnvScript({ VITE_APP_TITLE: value });

    expect(script).not.toMatch(/<\/script/i);
    expect(script).not.toContain('<');
    expect(script).not.toContain('\u2028');
    expect(run(script)).toEqual({ VITE_APP_TITLE: value });
  });

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
