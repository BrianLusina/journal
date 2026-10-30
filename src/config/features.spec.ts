import { FEATURE_DEFAULTS, parseFeatures } from './features';

describe('parseFeatures', () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
    delete window.__ENV__;
  });

  it.each([undefined, '', ' , '])('is the defaults when VITE_FEATURES is %p', raw => {
    expect(parseFeatures(raw)).toEqual(FEATURE_DEFAULTS);
    expect(warn).not.toHaveBeenCalled();
  });

  it.each([
    ['on', true],
    ['true', true],
    ['1', true],
    ['ON', true],
    ['off', false],
    ['false', false],
    ['0', false],
    ['Off', false],
  ])('reads %p as %p', (value, enabled) => {
    expect(parseFeatures(`search=${value}`).search).toBe(enabled);
    expect(parseFeatures(`newsletter=${value}`).newsletter).toBe(enabled);
  });

  it('turns a bare name on', () => {
    expect(parseFeatures('search').search).toBe(true);
  });

  it('applies several overrides and keeps the defaults of the others', () => {
    expect(parseFeatures(' search = on , newsletter=off ')).toEqual({
      ...FEATURE_DEFAULTS,
      search: true,
      newsletter: false,
    });
  });

  it.each(['serch=on', 'search=maybe', 'search=on=off', '=on', 'toString=on', 'search=constructor'])(
    'skips %p with a warning and still applies the valid entries',
    entry => {
      expect(parseFeatures(`${entry},newsletter=off`)).toEqual({
        ...FEATURE_DEFAULTS,
        newsletter: false,
      });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining(entry));
    },
  );

  it('reads VITE_FEATURES from the runtime configuration index.html sets', () => {
    window.__ENV__ = { VITE_FEATURES: 'search=on' };
    // jest.isolateModules hands back the module this file already imported, so reload it instead.
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const features: typeof import('./features').default = require('./features').default;

    expect(features.search).toBe(true);
  });
});
