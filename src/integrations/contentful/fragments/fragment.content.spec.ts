import { print } from 'graphql';
import { BlogFragment } from './fragment.content';

describe('BlogFragment', () => {
  it('bounds the author collection so the feed stays under the Contentful query cost limit', () => {
    expect(print(BlogFragment)).toContain('authorsCollection(limit: 5)');
  });

  it('fetches what the author badge displays, so authors are not fetched one by one', () => {
    const authors = print(BlogFragment).split('authorsCollection(limit: 5)')[1];

    expect(authors).toEqual(expect.stringContaining('name'));
    expect(authors).toEqual(expect.stringContaining('shortBio'));
    expect(authors).toMatch(/image\s*{\s*url\s*}/);
  });
});
