import { FLAG_PROVIDER_TIMEOUT_MS, resolveFlags, type FlagProvider } from './resolve';

const DEFAULTS = { analytics: false, search: true, banner: false };
const provider = (name: string, values: Record<string, unknown>): FlagProvider => ({ name, read: async () => values as Record<string, boolean> });

describe('resolveFlags', () => {
  it('keeps the defaults with no providers', async () => {
    await expect(resolveFlags(DEFAULTS, [])).resolves.toEqual(DEFAULTS);
  });

  it('takes each flag from the first provider that names it: remote, then env, then the default', async () => {
    const remote = provider('remote', { analytics: true });
    const env = provider('env', { analytics: false, search: false });

    await expect(resolveFlags(DEFAULTS, [remote, env])).resolves.toEqual({ analytics: true, search: false, banner: false });
  });

  it('ignores names the registry does not have', async () => {
    await expect(resolveFlags(DEFAULTS, [provider('remote', { unknown: true })])).resolves.toEqual(DEFAULTS);
  });

  it('falls through a provider that throws', async () => {
    const broken: FlagProvider = { name: 'remote', read: async () => Promise.reject(new Error('down')) };
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await expect(resolveFlags(DEFAULTS, [broken, provider('env', { analytics: true })])).resolves.toMatchObject({ analytics: true });
  });

  it('falls through a provider that never answers, once the timeout passes', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const hanging: FlagProvider = { name: 'remote', read: () => new Promise(() => undefined) };
    try {
      const resolved = resolveFlags(DEFAULTS, [hanging, provider('env', { analytics: true })]);
      await vi.advanceTimersByTimeAsync(FLAG_PROVIDER_TIMEOUT_MS);

      await expect(resolved).resolves.toMatchObject({ analytics: true });
    } finally {
      vi.useRealTimers();
    }
  });

  it('honours a shorter timeout', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const hanging: FlagProvider = { name: 'remote', read: () => new Promise(() => undefined) };
    try {
      const resolved = resolveFlags(DEFAULTS, [hanging], { timeoutMs: 10 });
      await vi.advanceTimersByTimeAsync(10);

      await expect(resolved).resolves.toEqual(DEFAULTS);
    } finally {
      vi.useRealTimers();
    }
  });
});
