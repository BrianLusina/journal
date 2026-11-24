import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { POST_PROJECTION, SEARCH_PROJECTION, projectedFields } from './projection';

// The schema Studio extracts (studio/schema.json, from `bun run schema:extract` in studio/). Read as
// data, so this package never imports `sanity`.
type ExtractedType = { name: string; attributes?: Record<string, unknown> };
const schemaPath = process.env.STUDIO_SCHEMA_PATH ?? resolve(__dirname, '../../../../studio/schema.json');
const schema: ExtractedType[] = JSON.parse(readFileSync(schemaPath, 'utf8'));
const fieldsOf = (type: string) => Object.keys(schema.find(entry => entry.name === type)?.attributes ?? {});

describe('the Sanity projections', () => {
  it.each([
    ['POST_PROJECTION', POST_PROJECTION],
    ['SEARCH_PROJECTION', SEARCH_PROJECTION],
  ])('%s reads only fields the Studio schema declares on blogPost', (_, projection) => {
    const fields = projectedFields(projection);

    expect(fields.length).toBeGreaterThan(5);
    expect(fields.filter(field => !fieldsOf('blogPost').includes(field))).toEqual([]);
  });

  // Fields read through references (`tags[]->name`, `authors[]->{…}`) live on the referenced types.
  it.each([
    ['tag', ['name']],
    ['author', ['name', 'shortBio', 'image']],
  ])('reads only fields the Studio schema declares on %s', (type, fields) => {
    expect(POST_PROJECTION).toContain(type === 'tag' ? 'tags[]->name' : 'authors[]->{');
    expect(fields.filter(field => !fieldsOf(type).includes(field))).toEqual([]);
  });

  it('takes the source field of an aliased projection, not the alias', () => {
    expect(projectedFields('{ _id, "slug": slug.current, "tags": tags[]->name, heroImage{ alt } }')).toEqual([
      '_id',
      'slug',
      'tags',
      'heroImage',
    ]);
  });
});
