/**
 * What packages/cms reads from a Sanity `blogPost`. Every field named here must exist in the Studio
 * schema (studio/schemaTypes); projection.spec.ts checks it against studio/schema.json.
 */

const ASSET = '{ alt, "url": asset->url }';

const LISTING_FIELDS = `
  _id,
  title,
  "slug": slug.current,
  subtitle,
  description,
  category,
  publishDate,
  "tags": tags[]->name,
  "authors": authors[]->{ _id, name, shortBio, "avatarUrl": image.asset->url },
  thumbnail${ASSET}`;

/** A post with everything an article page shows. Image blocks in the body carry their resolved URL. */
export const POST_PROJECTION = `{${LISTING_FIELDS},
  heroImage${ASSET},
  "body": body[]{ ..., _type == "image" => { "alt": alt, "url": asset->url } }
}`;

/** A post for the search index and listings' metadata: no body and no hero image. */
export const SEARCH_PROJECTION = `{${LISTING_FIELDS}
}`;

/**
 * The top-level schema fields a projection reads: a bare name, or the field an alias reads from
 * (`"slug": slug.current` reads `slug`).
 */
export function projectedFields(projection: string): string[] {
  const inner = projection.trim().replace(/^\{/, '').replace(/\}$/, '');
  const entries: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of inner) {
    if (char === '{' || char === '[' || char === '(') depth++;
    if (char === '}' || char === ']' || char === ')') depth--;
    if (char === ',' && depth === 0) {
      entries.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  entries.push(current);
  return entries
    .map(entry => entry.trim())
    .filter(Boolean)
    .map(entry => entry.replace(/^"[^"]+"\s*:\s*/, '').match(/^[A-Za-z_][A-Za-z0-9_]*/)?.[0] ?? entry);
}

type SanityAsset = { alt?: string | null; url?: string | null } | null;

/** One Portable Text node, as the body projection answers it. */
export type SanityBodyNode = { _type: string; _key: string; [field: string]: unknown };

/** A post as POST_PROJECTION (or, without body and heroImage, SEARCH_PROJECTION) answers it. */
export type SanityPost = {
  _id: string;
  title: string;
  slug: string;
  publishDate: string;
  subtitle?: string | null;
  description?: string | null;
  category?: string | null;
  tags?: (string | null)[] | null;
  authors?: ({ _id: string; name?: string | null; shortBio?: string | null; avatarUrl?: string | null } | null)[] | null;
  heroImage?: SanityAsset;
  thumbnail?: SanityAsset;
  body?: SanityBodyNode[] | null;
};
