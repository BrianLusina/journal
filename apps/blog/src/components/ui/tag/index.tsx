import type { FunctionComponent } from 'react';
import { LinkProvider, Tag as SharedTag, Tags as SharedTags } from '@brianlusina/ui';
import RouterLink from '@/components/Elements/Link/RouterLink';
import { ARTICLE_PAGE_BY_TAGS_ROUTE } from '@/routes/links';

// A tag page is addressed by the tag's name: it is the only identifier every source shares.
const tagHref = (name: string) => `${ARTICLE_PAGE_BY_TAGS_ROUTE}/${encodeURIComponent(name)}`;

// Bound to React Router here, so tag links navigate client-side under any router (see ArticleCard).
const Tag: FunctionComponent<{ name: string }> = ({ name }) => (
  <LinkProvider component={RouterLink}>
    <SharedTag name={name} href={tagHref(name)} />
  </LinkProvider>
);

const Tags: FunctionComponent<{ tags: string[] }> = ({ tags }) => (
  <LinkProvider component={RouterLink}>
    <SharedTags tags={tags} hrefFor={tagHref} />
  </LinkProvider>
);

export { Tag, Tags };
