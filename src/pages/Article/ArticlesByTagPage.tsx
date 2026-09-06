import { FunctionComponent } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { captureException, captureScope, Severity } from '@monitoring';
import {PageLoader, Pagination} from '@components';
import { humanizeDateTime } from '@timeUtils';
import { DATE_TIME_FORMAT_YYYY_MM_DD_hh_mm_ss, DATE_FORMAT_MMMM_D_YYYY } from '@timeConstants';
import ArticleCard from '@/components/ArticleCard';
import useFetchArticlesByTag from '@/hooks/api/useFetchArticlesByTag';
import { camelCaseToNormal } from '@/utils/utils';

const ArticlesByTagPage: FunctionComponent = () => {
  const { tag } = useParams();
  const [loading, error, data] = useFetchArticlesByTag(tag);

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    captureException(
      error,
      captureScope({ type: 'component', data: { component: 'ArticlesByTagPage', ...error } }, Severity.Error),
    );
    // FIXME: use error boundary for a component instead
    return <p>Yikes! Something terrible has happened. Looking into this :)</p>;
  }

  if (!data) {
    return <Navigate to="/404" replace />;
  }

  const posts = data.blogPostCollection.items;

  return (
    <main>
      {/* Hero Section */}
      <div className="mb-16 text-center space-y-6">
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-slide-up stagger-1">
          {camelCaseToNormal(tag)} articles.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((article, index) => (
          <div
            key={article.sys.id}
            className={`animate-slide-up stagger-${Math.min(index + 1, 6)}`}
          >
            <ArticleCard
              size="small"
              id={article.sys.id}
              slug={article.slug}
              title={article.title}
              category={article.category}
              date={humanizeDateTime(
                article.publishDate,
                DATE_TIME_FORMAT_YYYY_MM_DD_hh_mm_ss,
                DATE_FORMAT_MMMM_D_YYYY,
              )}
              thumbnail={article.thumbnail.url}
            />
          </div>
        ))}
      </div>
      {/* <Pagination onClick={handleSeeMore} /> */}
    </main>
  );
};

export default ArticlesByTagPage;
