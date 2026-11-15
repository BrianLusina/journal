import { readFileSync } from 'fs';
import path from 'path';

describe('readEnv', () => {
  const buildTimeValue = process.env.VITE_APP_TITLE;

  /** readEnv, from a build made with VITE_APP_TITLE set to value (or unset). */
  const readEnvBuiltWith = async (value: string | undefined): Promise<typeof import('./runtimeEnv').readEnv> => {
    if (value === undefined) {
      delete process.env.VITE_APP_TITLE;
    } else {
      process.env.VITE_APP_TITLE = value;
    }
    vi.resetModules();
    return (await import('./runtimeEnv')).readEnv;
  };

  afterEach(() => {
    delete window.__ENV__;
    if (buildTimeValue === undefined) {
      delete process.env.VITE_APP_TITLE;
    } else {
      process.env.VITE_APP_TITLE = buildTimeValue;
    }
  });

  it('reads the value index.html set at runtime over the one inlined at build time', async () => {
    const readEnv = await readEnvBuiltWith('Build time');
    window.__ENV__ = { VITE_APP_TITLE: 'Runtime' };

    expect(readEnv('VITE_APP_TITLE')).toBe('Runtime');
  });

  it('falls back to the build-time value when index.html does not set the key', async () => {
    const readEnv = await readEnvBuiltWith('Build time');
    window.__ENV__ = {};

    expect(readEnv('VITE_APP_TITLE')).toBe('Build time');
  });

  it('falls back to the build-time value when nothing set window.__ENV__', async () => {
    const readEnv = await readEnvBuiltWith('Build time');

    expect(readEnv('VITE_APP_TITLE')).toBe('Build time');
  });

  it('is undefined when neither sets the key', async () => {
    const readEnv = await readEnvBuiltWith(undefined);

    expect(readEnv('VITE_APP_TITLE')).toBeUndefined();
  });

  // Vite inlines the whole env object, every VITE_ variable at build time, for a computed key.
  it('reads each build-time value by name, never with a computed key', () => {
    const source = readFileSync(path.join(__dirname, 'runtimeEnv.ts'), 'utf8');

    expect(source).not.toMatch(/import\.meta\.env(?!\.VITE_\w)/);
  });
});
