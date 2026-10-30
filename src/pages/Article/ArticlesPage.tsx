import { FunctionComponent, useState } from 'react';
import { captureException, captureScope, Severity } from '@monitoring';
import { PageLoader, ArticleCard, Button } from '@components';
import { usePosts } from '@hooks';
import { humanizeDateTime } from '@timeUtils';
import { DATE_TIME_FORMAT_YYYY_MM_DD_hh_mm_ss, DATE_FORMAT_MMMM_D_YYYY } from '@timeConstants';

const ITEMS_PER_PAGE = 10;

const ArticlesPage: FunctionComponent = () => {
  const [currentSize, setCurrentSize] = useState<number>(ITEMS_PER_PAGE);
  const { loading, error, data } = usePosts({ limit: currentSize });

  if (loading && !data) {
    return <PageLoader />;
  }

  if (error) {
    captureException(
      error,
      captureScope({ type: 'component', data: { component: 'ArticlesPage' } }, Severity.Error),
    );
    // FIXME: use error boundary for a component instead
    return <p>Yikes! Something terrible has happened. Looking into this :)</p>;
  }

  const posts = data ? data.items : [];
  const hasNextPage = Boolean(data?.hasMore);

  const handleSeeMore = (): void => {
    setCurrentSize(posts.length + ITEMS_PER_PAGE);
  };

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
            key={article.id}
            className={`animate-slide-up stagger-${Math.min(index + 1, 6)}`}
          >
            <ArticleCard
              size="small"
              id={article.id}
              slug={article.slug}
              title={article.title}
              category={article.category || ''}
              date={humanizeDateTime(
                article.publishDate,
                DATE_TIME_FORMAT_YYYY_MM_DD_hh_mm_ss,
                DATE_FORMAT_MMMM_D_YYYY,
              )}
              thumbnail={article.thumbnail?.url || ''}
            />
          </div>
        ))}
      </div>
      {hasNextPage && (
        <div className="mt-8 flex justify-center">
          <Button variant="outline" onClick={handleSeeMore} disabled={loading}>
            Load More
          </Button>
        </div>
      )}
    </main>
  );
};

export default ArticlesPage;
