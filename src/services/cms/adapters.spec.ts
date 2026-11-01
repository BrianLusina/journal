import type CMSAdapter from './CMSAdapter';

describe('cmsAdapters', () => {
  afterEach(() => {
    delete window.__ENV__;
  });

  /** The registry, loaded afresh with VITE_FEATURES set to features at runtime. */
  const loadAdapters = (features: string): CMSAdapter[] => {
    window.__ENV__ = { VITE_FEATURES: features };
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./adapters').default;
  };

  it('reads Contentful, then Notion, while the notion feature is on', () => {
    expect(loadAdapters('notion=on').map(adapter => adapter.source)).toEqual(['contentful', 'notion']);
  });

  it('leaves Notion out while the notion feature is off', () => {
    expect(loadAdapters('notion=off').map(adapter => adapter.source)).toEqual(['contentful']);
  });
});
