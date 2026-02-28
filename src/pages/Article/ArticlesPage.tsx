import { FunctionComponent, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { captureException, captureScope, Severity } from '@services/monitoring';
import { useQuery } from '@apollo/client';
import PageLoader from '@components/Elements/Loaders/PageLoader';
import { humanizeDateTime } from '@timeUtils';
import { DATE_TIME_FORMAT_YYYY_MM_DD_hh_mm_ss, DATE_FORMAT_MMMM_D_YYYY } from '@timeConstants';
import { GET_ALL_BLOGS } from '@/api/graphql/queries';
import ArticleCard from '@/components/ArticleCard';
import {Pagination} from '@components/Pagination';

const ArticlesPage: FunctionComponent = () => {
  const itemsPerPage = 10;
  const [currentSize, setCurrentSize] = useState<number>(itemsPerPage);
  const { loading, error, data, fetchMore } = useQuery<BlogPostsData, GetAllBlogsVariables>(
    GET_ALL_BLOGS,
    {
      variables: {
        limit: currentSize,
      },
    },
  );

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    captureException(
      error,
      captureScope({ type: 'component', data: { component: 'Posts', ...error } }, Severity.Error),
    );
    // FIXME: use error boundary for a component instead
    return <p>Yikes! Something terrible has happened. Looking into this :)</p>;
  }

  const { items: posts, total } = data ? data.blogPostCollection : { items: [], total: 0 };

  let fetchedSize = posts.length;
  const hasNextPage = fetchedSize < total;

  const handleSeeMore = (): void => {
    if (hasNextPage) {
      fetchedSize += currentSize;
      setCurrentSize(fetchedSize);

      fetchMore({
        variables: {
          limit: fetchedSize,
        },
      });
    }
  };

  if (error) {
    captureException(
      error,
      captureScope({ type: 'component', data: { component: 'ArticlePage' } }, Severity.Error),
    );
    // FIXME: use error boundary for a component instead
    return <p>Yikes! Something terrible has happened. Looking into this :)</p>;
  }

  if (!data) {
    return <Navigate to="/404" replace />;
  }

  return (
    <main>
      {/* Hero Section */}
      <div className="mb-16 text-center space-y-6">
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-slide-up stagger-1">
          Discover all the articles that illuminate the paths of meaning and unravel the mysteries
          of life's spectrum. Dive into a world of reflection, inspiration, and discovery through
          our curated collection of insightful writings.
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
      <Pagination onClick={handleSeeMore} />

    </main>
  );
};

export default ArticlesPage;
