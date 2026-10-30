import { FunctionComponent } from 'react';
import ArticleCard from '@/components/ArticleCard';
import { usePosts } from '@/hooks/cms/usePosts';
import { captureException, captureScope, Severity } from '@/services/monitoring';
import { humanizeDateTime } from '@timeUtils';
import { DATE_TIME_FORMAT_YYYY_MM_DD_hh_mm_ss, DATE_FORMAT_MMMM_D_YYYY } from '@timeConstants';

type RelatedArticlesProps = {
  category: string;
};

const RelatedArticles: FunctionComponent<RelatedArticlesProps> = ({ category }) => {
  const { loading, error, data } = usePosts({ category, limit: 3 });

  if (loading && (!data || data.items.length === 0)) {
    // TODO: use component loader
    return <></>;
  }

  if (error) {
    captureException(
      error,
      captureScope({ type: 'component', data: { component: 'RelatedArticles' } }, Severity.Error),
    );
    // FIXME: use error boundary for a component instead
    return <p>Yikes! Something terrible has happened. Looking into this :)</p>;
  }

  const relatedArticles = data ? data.items : [];

  if (relatedArticles.length === 0) return null;

  return (
    <section className="bg-muted py-16 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold mb-8 animate-slide-up">You might also like</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {relatedArticles.map((relatedArticle, index) => (
            <div
              key={relatedArticle.id}
              className={`animate-slide-up stagger-${Math.min(index + 1, 3)}`}
            >
              <ArticleCard
                size="small"
                id={relatedArticle.id}
                slug={relatedArticle.slug}
                title={relatedArticle.title}
                category={relatedArticle.category || ''}
                date={humanizeDateTime(
                  relatedArticle.publishDate,
                  DATE_TIME_FORMAT_YYYY_MM_DD_hh_mm_ss,
                  DATE_FORMAT_MMMM_D_YYYY,
                )}
                thumbnail={relatedArticle.thumbnail ? relatedArticle.thumbnail.url : ''}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RelatedArticles;
