import { FunctionComponent } from 'react';
import MiniPostItem from '@components/MiniPost';
import { useQuery } from '@apollo/client';
import { GET_ALL_BLOGS } from '@graphQl/queries';
import { captureException, captureScope, Severity } from '@services/monitoring';
import { humanizeDateTime } from '@timeUtils';
// eslint-disable-next-line camelcase
import { DATE_TIME_FORMAT_YYYY_MM_DD_hh_mm_ss, DATE_FORMAT_MMMM_D_YYYY } from '@timeConstants';

const MiniPosts: FunctionComponent = () => {
  const { loading, error, data } = useQuery<BlogPostsData, GetAllBlogsVariables>(GET_ALL_BLOGS, {
    variables: {
      limit: 5,
    },
  });

  // FIXME: use a component loader for this. Preferably a Skeleton loader
  if (loading) return <div>Loading...</div>;

  if (error) {
    // FIXME: use error boundary for a component instead
    captureException(
      error,
      captureScope({ type: 'component', data: { component: 'Blurb' } }, Severity.Error),
    );
    return <p>Yikes! Something terrible has happened. Looking into this :)</p>;
  }

  const posts = data ? data.blogPostCollection.items : [];

  return (
    <section>
      <div className="mini-posts">
        {posts.map(
          ({
            sys: { id },
            title,
            thumbnail: { url },
            slug,
            publishDate,
            authorsCollection: { items: authors },
          }) => (
            <MiniPostItem
              key={id}
              slug={slug}
              id={id}
              link={`${id}/${slug}`}
              title={title}
              // FIXME: author info
              authors={authors.map(({ sys: { id: authorId } }) => ({
                name: '',
                id: authorId,
                link: '',
                slug: '',
                avatar: '',
              }))}
              time={humanizeDateTime(
                publishDate,
                DATE_TIME_FORMAT_YYYY_MM_DD_hh_mm_ss,
                DATE_FORMAT_MMMM_D_YYYY,
              )}
              imgUrl={url}
            />
          ),
        )}
      </div>
    </section>
  );
};

export default MiniPosts;
