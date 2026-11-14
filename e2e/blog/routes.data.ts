/**
 * Routes that render without data from a slug, including the aliases in src/routes/routes.ts.
 * `/authors` is tested on its own while it is broken (BrianLusina/journal#946).
 */
export const STATIC_ROUTES: readonly string[] = [
  '/',
  '/articles',
  '/article',
  '/about',
  '/about-us',
  '/contact',
  '/contact-us',
  '/privacy',
  '/terms',
];

/** A long-standing Contentful post, used by the screenshot and accessibility tests. */
export const SNAPSHOT_ARTICLE_PATH = '/article/vomuFcNE5DD9sDzRrZ9if/perspective';

export const UNKNOWN_ROUTE = '/this-route-does-not-exist';
