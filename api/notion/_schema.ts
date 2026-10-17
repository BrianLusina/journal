/**
 * Property names of the 📰 Journal CMS data source, spelled exactly as Notion has them: Notion
 * matches names case included, and rejects a whole query that filters on a property it does not
 * have. The posts routes and NotionAdapter read every name from here. docs/ARCHITECTURE.md lists
 * each property's type; change both when the database changes.
 *
 * This file lives under api/ so Vercel compiles it as CommonJS with the functions; it holds only
 * constants, so the browser bundle can import it too.
 */
export const NOTION_PROPERTY = {
  title: 'Title',
  slug: 'Slug',
  description: 'Description',
  category: 'Category',
  published: 'Published',
  draft: 'Draft',
  tags: 'Tags',
  authors: 'Authors',
  coverImage: 'Cover Image',
} as const;

/**
 * A post is published when it is not a draft and has a publish date: the merged feed orders every
 * source by publish date, so an undated post has no place in it. Both routes apply this, so a post
 * can be opened by slug exactly when it can be listed.
 */
export const publishedFilters = [
  { property: NOTION_PROPERTY.draft, checkbox: { equals: false } },
  { property: NOTION_PROPERTY.published, date: { is_not_empty: true as const } },
];
