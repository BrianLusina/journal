import { FunctionComponent, useState } from 'react';
import ArticleCard from '@/components/ArticleCard';
import { captureException, captureScope, Severity } from '@services/monitoring';
import { useQuery } from '@apollo/client';
import { GET_ALL_BLOGS } from '@graphQl/queries';
import { humanizeDateTime } from '@timeUtils';
import { DATE_TIME_FORMAT_YYYY_MM_DD_hh_mm_ss, DATE_FORMAT_MMMM_D_YYYY } from '@timeConstants';

const FeaturedArticles: FunctionComponent = () => {
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

  // FIXME: use a component loader for this. Preferably a Skeleton loader
  if (loading) return <div>Loading...</div>;

  if (error) {
    captureException(
      error,
      captureScope({ type: 'component', data: { component: 'Posts', ...error } }, Severity.Error),
    );
    // FIXME: use error boundary for a component instead
    return <p>Yikes! Something terrible has happened. Looking into this :)</p>;
  }

  const { items: posts } = data ? data.blogPostCollection : { items: [] };

  const featuredArticles = posts.slice(0, 6);

  return (
    <section id="articles" className="py-12">
      <div className="flex items-center justify-between mb-12 animate-slide-up">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Featured Articles</h2>
        <a
          href="#all"
          className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors px-4 py-2 rounded-full hover:bg-muted/60"
        >
          View all →
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {featuredArticles.map((article, index) => (
          <div key={article.sys.id} className={`animate-slide-up stagger-${Math.min(index + 1, 6)}`}>
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
    </section>
  );
};

export default FeaturedArticles;
