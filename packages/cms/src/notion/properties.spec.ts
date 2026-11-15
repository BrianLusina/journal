import { listedFilters, NOTION_PROPERTY, PUBLISHED_STATUS, publishedFilters } from './properties';

describe('the Notion publishing rules', () => {
  it('publishes a post only when its Status is Published and it has a publish date', () => {
    expect(publishedFilters).toEqual([
      { property: 'Status', status: { equals: 'Published' } },
      { property: 'Published', date: { is_not_empty: true } },
    ]);
    expect(PUBLISHED_STATUS).toBe('Published');
  });

  it('lists a post only when it is published and has a slug, since posts are opened by slug', () => {
    expect(listedFilters).toEqual([
      ...publishedFilters,
      { property: NOTION_PROPERTY.slug, rich_text: { is_not_empty: true } },
    ]);
  });
});
