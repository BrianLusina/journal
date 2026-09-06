import { FunctionComponent } from 'react';
import {MiniPost as MiniPostItem} from '@components';
import { usePosts } from '@hooks';
import { captureException, captureScope, Severity } from '@monitoring';
import { humanizeDateTime } from '@timeUtils';
// eslint-disable-next-line camelcase
import { DATE_TIME_FORMAT_YYYY_MM_DD_hh_mm_ss, DATE_FORMAT_MMMM_D_YYYY } from '@timeConstants';

const MiniPosts: FunctionComponent = () => {
  const { loading, error, data } = usePosts({ limit: 5 });

  // FIXME: use a component loader for this. Preferably a Skeleton loader
  if (loading && (!data || data.items.length === 0)) return <div>Loading...</div>;

  if (error) {
    captureException(
      error,
      captureScope({ type: 'component', data: { component: 'Blurb', ...error } }, Severity.Error),
    );
    // FIXME: use error boundary for a component instead
    return <p>Yikes! Something terrible has happened. Looking into this :)</p>;
  }

  const posts = data ? data.items : [];

  return (
    <section>
      <div className="mini-posts">
        {posts.map(
          ({
            id,
            title,
            thumbnail,
            slug,
            publishDate,
            authors,
          }) => (
            <MiniPostItem
              key={id}
              slug={slug}
              id={id}
              link={`${id}/${slug}`}
              title={title}
              authorIds={authors.map(author => author.id)}
              time={humanizeDateTime(
                publishDate,
                DATE_TIME_FORMAT_YYYY_MM_DD_hh_mm_ss,
                DATE_FORMAT_MMMM_D_YYYY,
              )}
              imgUrl={thumbnail?.url || ''}
            />
          ),
        )}
      </div>
    </section>
  );
};

export default MiniPosts;
