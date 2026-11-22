import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { POST_PROJECTION, SEARCH_PROJECTION, projectedFields } from './projection';

// The schema Studio extracts (studio/schema.json, from `bun run schema:extract` in studio/). Read as
// data, so this package never imports `sanity`.
type ExtractedType = { name: string; attributes?: Record<string, unknown> };
const schema: ExtractedType[] = JSON.parse(readFileSync(resolve(__dirname, '../../../../studio/schema.json'), 'utf8'));
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

  it('reads author fields the Studio schema declares on author', () => {
    expect(['name', 'shortBio', 'image'].filter(field => !fieldsOf('author').includes(field))).toEqual([]);
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
