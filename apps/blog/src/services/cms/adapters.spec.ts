import type CMSAdapter from './CMSAdapter';

describe('cmsAdapters', () => {
  afterEach(() => {
    delete window.__ENV__;
  });

  /** The registry, loaded afresh with VITE_FEATURES set to features at runtime. */
  const loadAdapters = async (features: string): Promise<CMSAdapter[]> => {
    window.__ENV__ = { VITE_FEATURES: features };
    vi.resetModules();
    return (await import('./adapters')).default;
  };

  it('reads Contentful, then Notion, while the notion feature is on', async () => {
    expect((await loadAdapters('notion=on')).map(adapter => adapter.source)).toEqual(['contentful', 'notion']);
  });

  it('leaves Notion out while the notion feature is off', async () => {
    expect((await loadAdapters('notion=off')).map(adapter => adapter.source)).toEqual(['contentful']);
  });
});
