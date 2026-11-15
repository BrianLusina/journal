import type { MockInstance } from 'vitest';
import { FEATURE_DEFAULTS, parseFeatures } from './features';

describe('parseFeatures', () => {
  let warn: MockInstance;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
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
    expect(parseFeatures(' search = on , notion=off ')).toEqual({
      ...FEATURE_DEFAULTS,
      search: true,
      notion: false,
    });
  });

  it.each(['serch=on', 'search=maybe', 'search=on=off', '=on', 'toString=on', 'search=constructor'])(
    'skips %p with a warning and still applies the valid entries',
    entry => {
      expect(parseFeatures(`${entry},notion=off`)).toEqual({
        ...FEATURE_DEFAULTS,
        notion: false,
      });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining(entry));
    },
  );

  /** The flags features.ts exports, loaded afresh. */
  const loadFeatures = async (): Promise<typeof import('./features').default> => {
    vi.resetModules();
    return (await import('./features')).default;
  };

  it('reads VITE_FEATURES from the runtime configuration index.html sets', async () => {
    window.__ENV__ = { VITE_FEATURES: 'search=on' };

    expect((await loadFeatures()).search).toBe(true);
  });

  it('falls back to the VITE_FEATURES value inlined at build time', async () => {
    const buildTimeValue = process.env.VITE_FEATURES;
    process.env.VITE_FEATURES = 'search=on';
    window.__ENV__ = {};
    try {
      expect((await loadFeatures()).search).toBe(true);
    } finally {
      if (buildTimeValue === undefined) {
        delete process.env.VITE_FEATURES;
      } else {
        process.env.VITE_FEATURES = buildTimeValue;
      }
    }
  });
});
