import { EDGE_CONFIG_TTL_MS, edgeConfigProvider } from './edgeConfig';

// Reads are cached per store for the module's lifetime, so each test uses a store of its own.
let store = 0;
const connection = () => `https://edge-config.vercel.com/ecfg_${++store}?token=tok-1`;
const json = (body: unknown, status = 200) => ({ ok: status < 300, status, json: async () => body }) as Response;

describe('edgeConfigProvider', () => {
  beforeEach(() => vi.spyOn(console, 'warn').mockImplementation(() => undefined));

  it('reads every item of the store named by the connection string', async () => {
    const fetch = vi.fn().mockResolvedValue(json({ analytics: true }));

    await expect(edgeConfigProvider('https://edge-config.vercel.com/ecfg_abc?token=tok-1', { fetch, now: () => 0 }).read()).resolves.toEqual({
      analytics: true,
    });
    expect(fetch).toHaveBeenCalledWith('https://edge-config.vercel.com/ecfg_abc/items?token=tok-1');
  });

  it('keeps boolean values only, flag by flag', async () => {
    const fetch = vi.fn().mockResolvedValue(json({ analytics: true, banner: 'yes', limit: 3, search: false }));

    await expect(edgeConfigProvider(connection(), { fetch, now: () => 0 }).read()).resolves.toEqual({ analytics: true, search: false });
  });

  it('reuses a read until the TTL passes, then reads again', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(json({ analytics: true })).mockResolvedValueOnce(json({ analytics: false }));
    let clock = 1_000;
    const store = edgeConfigProvider('https://edge-config.vercel.com/ecfg_ttl?token=t', { fetch, now: () => clock });

    await store.read();
    clock += EDGE_CONFIG_TTL_MS - 1;
    await expect(store.read()).resolves.toEqual({ analytics: true });
    expect(fetch).toHaveBeenCalledTimes(1);

    clock += 1;
    await expect(store.read()).resolves.toEqual({ analytics: false });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['no connection string', () => undefined, () => json({})],
    ['a connection string without a token', () => 'https://edge-config.vercel.com/ecfg_notoken', () => json({})],
    ['a 401', connection, () => json({ error: 'unauthorized' }, 401)],
    ['a body that is not JSON', connection, () => ({ ok: true, status: 200, json: async () => Promise.reject(new SyntaxError('bad')) }) as unknown as Response],
    ['a body that is not an object', connection, () => json(['analytics'])],
    ['a network error', connection, () => Promise.reject(new TypeError('fetch failed'))],
  ])('reads nothing, without throwing, with %s', async (_, store, answer) => {
    const fetch = vi.fn().mockImplementation(answer);

    await expect(edgeConfigProvider(store(), { fetch, now: () => 0 }).read()).resolves.toEqual({});
  });
});
