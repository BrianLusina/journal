import { FunctionComponent, useState } from 'react';
import { Button } from '@components/ui/button';
import { captureException, captureScope, Severity } from '@services/monitoring';
import { usePosts } from '@hooks/cms/usePosts';
import { humanizeDateTime } from '@timeUtils';
// eslint-disable-next-line camelcase
import { DATE_TIME_FORMAT_YYYY_MM_DD_hh_mm_ss, DATE_FORMAT_MMMM_D_YYYY } from '@timeConstants';
import PostItem from './PostItem';

const Posts: FunctionComponent = () => {
  const itemsPerPage = 10;
  const [currentSize, setCurrentSize] = useState<number>(itemsPerPage);
  const { loading, error, data } = usePosts({ limit: currentSize });

  // FIXME: use a component loader for this. Preferably a Skeleton loader
  if (loading && (!data || data.items.length === 0)) return <div>Loading...</div>;

  if (error) {
    console.error('Posts Error:', error);
    captureException(
      error,
      captureScope({ type: 'component', data: { component: 'Posts', ...error } }, Severity.Error),
    );
    // FIXME: use error boundary for a component instead
    return <p>Yikes! Something terrible has happened. Looking into this :)</p>;
  }

  const posts = data ? data.items : [];
  const total = data ? data.total : 0;

  let fetchedSize = posts.length;
  const hasNextPage = data?.hasMore ?? fetchedSize < total;

  const handleSeeMore = (): void => {
    if (hasNextPage) {
      fetchedSize += itemsPerPage;
      setCurrentSize(fetchedSize);
    }
  };

  return (
    <section>
      {posts.map(
        ({
          id,
          title,
          subtitle,
          description,
          heroImage,
          publishDate,
          tags,
          slug,
          authors,
        }) => (
          <PostItem
            key={id}
            id={id}
            title={title}
            subtitle={subtitle || ''}
            excerpt={description || ''}
            img={{
              src: heroImage?.url || '',
              alt: heroImage?.title || title,
            }}
            date={humanizeDateTime(
              publishDate,
              DATE_TIME_FORMAT_YYYY_MM_DD_hh_mm_ss,
              DATE_FORMAT_MMMM_D_YYYY,
            )}
            tags={tags}
            link={`${id}/${slug}`}
            authorIds={authors.map(author => author.id)}
          />
        ),
      )}
      {hasNextPage && (
        <div className="mt-8 flex justify-center">
          <Button variant="outline" onClick={handleSeeMore}>
            Load More
          </Button>
        </div>
      )}
    </section>
  );
};

export default Posts;
