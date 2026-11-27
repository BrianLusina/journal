import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SITE_FLAGS, siteFlags } from './flags';

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV, SITES_FEATURES: undefined, EDGE_CONFIG: undefined };
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});
afterEach(() => {
  process.env = ORIGINAL_ENV;
  vi.unstubAllGlobals();
});

describe('siteFlags', () => {
  it('keeps analytics off with no provider', async () => {
    await expect(siteFlags('home')).resolves.toEqual({ analytics: false });
  });

  it('turns analytics on from SITES_FEATURES', async () => {
    process.env.SITES_FEATURES = 'analytics=on';

    await expect(siteFlags('folio')).resolves.toEqual({ analytics: true });
  });

  it('lets Edge Config win over SITES_FEATURES', async () => {
    process.env.SITES_FEATURES = 'analytics=on';
    process.env.EDGE_CONFIG = 'https://edge-config.vercel.com/ecfg_sites?token=t';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ analytics: false }) }));

    await expect(siteFlags('home')).resolves.toEqual({ analytics: false });
  });

  it('leaves out a flag that does not apply to the site', async () => {
    expect(SITE_FLAGS.analytics.sites).toEqual(['home', 'folio']);
    await expect(siteFlags('home')).resolves.not.toHaveProperty('blogOnly');
  });
});

// Edge Config is read at render, never in middleware (spec §6.6): middleware runs on every request.
it('is never read from the middleware', () => {
  const middleware = readFileSync(resolve(__dirname, 'middleware.ts'), 'utf8');

  expect(middleware).not.toMatch(/from ['"](\.\/flags|@brianlusina\/flags)['"]/);
});
