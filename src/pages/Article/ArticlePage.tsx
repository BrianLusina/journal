import { FunctionComponent } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from '@components/Elements/Link';
import { captureException, captureScope, Severity } from '@services/monitoring';
import PageLoader from '@components/Elements/Loaders/PageLoader';
import { humanizeDateTime } from '@timeUtils';
import { kebabCase } from 'lodash';
import useFetchArticle from '@hooks/api/useFetchArticle';
import AuthorBadge from '@features/AuthorBadge';
// eslint-disable-next-line camelcase
import { DATE_TIME_FORMAT_YYYY_MM_DD_hh_mm_ss, DATE_FORMAT_MMMM_D_YYYY } from '@timeConstants';

const ArticlePage: FunctionComponent = () => {
  const { slug, id } = useParams();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const [loading, error, data] = useFetchArticle(id!);

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    captureException(
      error,
      captureScope({ type: 'component', data: { component: 'ArticlePage' } }, Severity.Error),
    );
    // FIXME: use error boundary for a component instead
    return <p>Yikes! Something terrible has happened. Looking into this :)</p>;
  }

  if (!data) {
    // TODO: display error or redirect to 404?
    return <p>Page Not Found</p>;
  }

  const {
    heroImage: { url: imageUrl },
    title,
    subtitle,
    publishDate,
    body,
    contentfulMetadata: { tags },
    authorsCollection: { items: authors },
  } = data.blogPost;

  const publishDateHumanized = humanizeDateTime(
    publishDate,
    DATE_TIME_FORMAT_YYYY_MM_DD_hh_mm_ss,
    DATE_FORMAT_MMMM_D_YYYY,
  );

  return (
    <article className="post">
      <header>
        <div className="title">
          <h2>
            <Link to={`${id}/${slug}`}>{title}</Link>
          </h2>
          <p>{subtitle}</p>
        </div>
        <div className="meta">
          <time className="published" dateTime={publishDate}>
            {publishDateHumanized}
          </time>
          {authors.map(({ sys: { id: authorId } }) => (
            <AuthorBadge key={id} authorId={authorId} />
          ))}
        </div>
      </header>
      <span className="image featured">
        <img src={imageUrl} alt={title} />
      </span>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
      <footer>
        <ul className="stats">
          {tags.map(({ id: tagId, name }) => (
            <li key={tagId}>
              <Link to={`tags/${kebabCase(name)}`}>{name}</Link>
            </li>
          ))}
          {/* TODO: Comment box and love hearts */}
          {/* <li>
            <a href="#love" className="icon fa-heart">
              28
            </a>
          </li>
          <li>
            <a href="#comments" className="icon fa-comment">
              128
            </a>
          </li> */}
        </ul>
      </footer>
    </article>
  );
};

export default ArticlePage;
