// The Contentful credentials are server only. Do not prefix these variables with VITE_: Vite
// inlines those into the browser bundle.
function config() {
  return {
    apiKey: process.env.CONTENTFUL_CMS_API_KEY,
    spaceId: process.env.CONTENTFUL_CMS_SPACE_ID,
    environment: process.env.CONTENTFUL_CMS_ENVIRONMENT || 'master',
    graphQlUrl: process.env.CONTENTFUL_CMS_GRAPHQL_URL || 'https://graphql.contentful.com',
    restApiUrl: process.env.CONTENTFUL_CMS_REST_API_URL || 'https://cdn.contentful.com',
  };
}

export function isContentfulConfigured(): boolean {
  const { apiKey, spaceId } = config();
  return Boolean(apiKey && spaceId);
}

/** The fields of a blog post that the unified post model is built from. */
const POST_FIELDS = `
  sys {
    id
    firstPublishedAt
  }
  title
  subtitle
  description
  category
  slug
  body
  publishDate
  tags
  heroImage {
    url
    description
    title
  }
  thumbnail {
    url
    description
    title
  }
  contentfulMetadata {
    tags {
      id
      name
    }
  }
  # Bounded: Contentful prices an unbounded collection at its default limit of 100 per post,
  # and each author's linked image adds to that, which can exceed the query cost limit.
  authorsCollection(limit: 5) {
    items {
      sys {
        id
      }
      # \`authors\` accepts any entry type, so its items are typed as the Entry interface and
      # Person fields are only selectable through \`... on Person\`.
      ... on Person {
        name
        shortBio
        image {
          url
        }
      }
    }
  }
`;

export const GET_BLOG_POSTS = `
  query GetBlogPosts($skip: Int, $limit: Int, $where: BlogPostFilter, $order: [BlogPostOrder]) {
    blogPostCollection(skip: $skip, limit: $limit, where: $where, order: $order) {
      total
      items {
        ${POST_FIELDS}
      }
    }
  }
`;

export type BlogPostCollection = { total: number; items: unknown[] };

/** Runs a GraphQL query against the Contentful space. Rejects on an HTTP or GraphQL error. */
export async function queryContentful(
  query: string,
  variables: Record<string, unknown>,
): Promise<{ blogPostCollection: BlogPostCollection }> {
  const { apiKey, spaceId, environment, graphQlUrl } = config();
  const response = await fetch(`${graphQlUrl}/content/v1/spaces/${spaceId}/environments/${environment}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) {
    throw new Error(`Unable to query Contentful: ${response.status}`);
  }

  const { data, errors } = (await response.json()) as {
    data?: { blogPostCollection: BlogPostCollection };
    errors?: { message: string }[];
  };
  if (errors?.length || !data) {
    throw new Error(`Contentful query failed: ${errors?.map(error => error.message).join('; ') || 'no data'}`);
  }
  return data;
}

// A warm function instance can outlive a tag change, so the tag list is read again after this long.
const TAG_LIST_TTL_MS = 5 * 60 * 1000;

let tagList: { loadedAt: number; idsByName: Promise<Map<string, string>> } | undefined;

async function fetchTagIdsByName(): Promise<Map<string, string>> {
  // The GraphQL API cannot list tags, so this uses the delivery REST API with the same token.
  const { apiKey, spaceId, environment, restApiUrl } = config();
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
 * tag pages are addressed by name. Tag names are unique, and the list is cached per function instance for a few minutes.
 */
export function getTagId(name: string): Promise<string | undefined> {
  if (!tagList || Date.now() - tagList.loadedAt > TAG_LIST_TTL_MS) {
    const idsByName = fetchTagIdsByName();
    const list = { loadedAt: Date.now(), idsByName };
    tagList = list;
    // Do not cache a failure; the next lookup retries.
    idsByName.catch(() => {
      if (tagList === list) tagList = undefined;
    });
  }
  return tagList.idsByName.then(ids => ids.get(name));
}
