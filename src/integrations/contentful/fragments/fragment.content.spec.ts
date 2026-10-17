import { print } from 'graphql';
import { BlogFragment } from './fragment.content';

describe('BlogFragment', () => {
  it('bounds the author collection so the feed stays under the Contentful query cost limit', () => {
    expect(print(BlogFragment)).toContain('authorsCollection(limit: 5)');
  });

  it('fetches what the author badge displays, so authors are not fetched one by one', () => {
    // `authors` links to any Entry (the field has no content type validation), so Contentful types
    // its items as the Entry interface: Person fields are only selectable through `... on Person`.
    const authors = print(BlogFragment).split('authorsCollection(limit: 5)')[1];
    const person = authors.match(/\.\.\. on Person {([^}]*{[^}]*}[^}]*)}/)?.[1] ?? '';
    expect(person).toMatch(/\bname\b/);
    expect(person).toMatch(/\bshortBio\b/);
    expect(person).toMatch(/image\s*{\s*url\s*}/);
  });
});
