import type { FunctionComponent } from 'react';
import { ArticleCard as SharedArticleCard, LinkProvider, type ArticleCardProps } from '@brianlusina/ui';
import RouterLink from '@/components/Elements/Link/RouterLink';

type BlogArticleCardProps = Omit<ArticleCardProps, 'href'> & { id: string; slug: string };

/**
 * The design system's ArticleCard, linking to the blog's own article route through React Router.
 * The provider is bound here rather than at the app root, so the card navigates client-side under
 * any router it is rendered in (tests mount their own).
 */
const ArticleCard: FunctionComponent<BlogArticleCardProps> = ({ id, slug, ...props }) => (
  <LinkProvider component={RouterLink}>
    <SharedArticleCard href={`/article/${id}/${slug}`} {...props} />
  </LinkProvider>
);

export default ArticleCard;
