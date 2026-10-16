import { readEnv } from './runtimeEnv';

describe('readEnv', () => {
  const buildTimeValue = process.env.VITE_APP_TITLE;

  afterEach(() => {
    delete window.__ENV__;
    if (buildTimeValue === undefined) {
      delete process.env.VITE_APP_TITLE;
    } else {
      process.env.VITE_APP_TITLE = buildTimeValue;
    }
  });

  it('reads the value /env.js set at runtime over the one inlined at build time', () => {
    process.env.VITE_APP_TITLE = 'Build time';
    window.__ENV__ = { VITE_APP_TITLE: 'Runtime' };

    expect(readEnv('VITE_APP_TITLE')).toBe('Runtime');
  });

  it('falls back to the build-time value when /env.js does not set the key', () => {
    process.env.VITE_APP_TITLE = 'Build time';
    window.__ENV__ = {};

    expect(readEnv('VITE_APP_TITLE')).toBe('Build time');
  });

  it('falls back to the build-time value when /env.js did not run', () => {
    process.env.VITE_APP_TITLE = 'Build time';

    expect(readEnv('VITE_APP_TITLE')).toBe('Build time');
  });

  it('is undefined when neither sets the key', () => {
    delete process.env.VITE_APP_TITLE;

    expect(readEnv('VITE_APP_TITLE')).toBeUndefined();
  });
});
