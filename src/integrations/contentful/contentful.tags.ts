import config from '@config';

const {
  api: {
    contentfulCms: { restApiUrl, spaceId, environment, apiKey },
  },
} = config;

let tagIdsByName: Promise<Map<string, string>> | undefined;

async function fetchTagIdsByName(): Promise<Map<string, string>> {
  // The GraphQL API cannot list tags, so this uses the delivery REST API with the same token.
  const response = await fetch(`${restApiUrl}/spaces/${spaceId}/environments/${environment}/tags?limit=1000`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) {
    throw new Error(`Unable to fetch Contentful tags: ${response.status}`);
  }

  const { items } = (await response.json()) as { items: { name: string; sys: { id: string } }[] };
  return new Map(items.map(tag => [tag.name, tag.sys.id]));
}

/**
 * The ID of the Contentful tag named `name`, if any. Posts can only be filtered by tag ID, while
 * tag pages are addressed by name. Tag names are unique, and the list is fetched once per page load.
 */
export function getTagId(name: string): Promise<string | undefined> {
  if (!tagIdsByName) {
    tagIdsByName = fetchTagIdsByName().catch(error => {
      // Do not cache a failure; the next lookup retries.
      tagIdsByName = undefined;
      throw error;
    });
  }
  return tagIdsByName.then(ids => ids.get(name));
}
