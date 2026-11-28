import type { FlagProvider } from './resolve';

/**
 * How long a read is reused, per server instance. Hobby allows 100,000 Edge Config reads a month and
 * pauses the store when that's exceeded; at one read per 5 minutes, an instance makes at most 288
 * a day.
 */
export const EDGE_CONFIG_TTL_MS = 300_000;

const cache = new Map<string, { at: number; values: Partial<Record<string, boolean>> }>();

/** The store's items URL, from a connection string like https://edge-config.vercel.com/<id>?token=<token>. */
function itemsUrl(connection: string): string | undefined {
  try {
    const url = new URL(connection);
    const token = url.searchParams.get('token');
    if (!token) return undefined;
    return `${url.origin}${url.pathname.replace(/\/$/, '')}/items?token=${encodeURIComponent(token)}`;
  } catch {
    return undefined;
  }
}

async function readItems(url: string, fetchItems: typeof fetch): Promise<Partial<Record<string, boolean>>> {
  const response = await fetchItems(url);
  if (!response.ok) throw new Error(`Edge Config answered ${response.status}`);
  const items: unknown = await response.json();
  if (typeof items !== 'object' || items === null || Array.isArray(items)) throw new Error('Edge Config answered no items object');
  return Object.fromEntries(Object.entries(items).filter(([, value]) => typeof value === 'boolean'));
}

/**
 * Flags from a Vercel Edge Config store (`EDGE_CONFIG`). Read server-side only, through `fetch` with
 * no SDK, and cached for `ttlMs`. A missing or broken store reads as no flags, never an error.
 */
export function edgeConfigProvider(
  connection: string | undefined,
  options: { ttlMs?: number; fetch?: typeof fetch; now?: () => number } = {},
): FlagProvider {
  const ttlMs = options.ttlMs ?? EDGE_CONFIG_TTL_MS;
  const now = options.now ?? Date.now;
  return {
    name: 'edge-config',
    async read() {
      const url = connection ? itemsUrl(connection) : undefined;
      if (!url) return {};
      const cached = cache.get(url);
      if (cached && now() - cached.at < ttlMs) return cached.values;
      try {
        const values = await readItems(url, options.fetch ?? fetch);
        cache.set(url, { at: now(), values });
        return values;
      } catch (error) {
        console.warn('Flags: Edge Config could not be read', error);
        return {};
      }
    },
  };
}
