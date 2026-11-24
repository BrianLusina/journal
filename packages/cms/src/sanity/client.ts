// The Sanity credentials are server only. Do not prefix these variables with VITE_: Vite inlines those
// into the browser bundle. The datasets are private, so every read needs the token.
function config() {
  return {
    projectId: process.env.SANITY_PROJECT_ID,
    token: process.env.SANITY_API_TOKEN,
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: process.env.SANITY_API_VERSION || '2025-02-19',
  };
}

export function isSanityConfigured(): boolean {
  const { projectId, token } = config();
  return Boolean(projectId && token);
}

/**
 * Runs a GROQ query over the HTTP API. Values go as `$name` parameters, never into the query text.
 * A Viewer token can read drafts, so the perspective is always `published`: callers can't change it.
 */
export async function querySanity<T>(query: string, params: Record<string, unknown>): Promise<T> {
  const { projectId, token, dataset, apiVersion } = config();
  const url = new URL(`https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`);
  url.searchParams.set('query', query);
  for (const [name, value] of Object.entries(params)) {
    if (name !== 'perspective') url.searchParams.set(`$${name}`, JSON.stringify(value));
  }
  url.searchParams.set('perspective', 'published');

  const response = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) {
    throw new Error(`Sanity query failed: ${response.status}`);
  }
  const { result } = (await response.json()) as { result: T };
  return result;
}
