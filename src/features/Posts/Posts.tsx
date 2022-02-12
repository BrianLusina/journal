import { FunctionComponent, useState } from 'react';
import Pagination from '@components/Pagination';
import PostItem from '@components/PostItem';
import { captureException, captureScope, Severity } from '@services/monitoring';
import { useQuery } from '@apollo/client';
import { GET_ALL_BLOGS } from '@graphQl/queries';
import { humanizeDateTime } from '@timeUtils';
// eslint-disable-next-line camelcase
import { DATE_TIME_FORMAT_YYYY_MM_DD_hh_mm_ss, DATE_FORMAT_MMMM_D_YYYY } from '@timeConstants';

const Posts: FunctionComponent = () => {
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
    // FIXME: use error boundary for a component instead
    captureException(
      error,
      captureScope({ type: 'component', data: { component: 'Posts' } }, Severity.Error),
    );
    return <p>Yikes! Something terrible has happened. Looking into this :)</p>;
  }

  const posts = data ? data.blogPostCollection.items : [];
  const total = data ? data.blogPostCollection.total : 0;

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

  return (
    <section>
      {posts.map(
        ({
          title,
          subtitle,
          description,
          sys: { id },
          heroImage: { url, title: imgTitle },
          publishDate,
          contentfulMetadata: { tags },
          slug,
        }) => (
          <PostItem
            key={id}
            id={id}
            title={title}
            subtitle={subtitle}
            excerpt={description}
            img={{
              src: url,
              alt: imgTitle,
            }}
            date={humanizeDateTime(
              publishDate,
              DATE_TIME_FORMAT_YYYY_MM_DD_hh_mm_ss,
              DATE_FORMAT_MMMM_D_YYYY,
            )}
            tags={tags.map(({ name }) => name)}
            link={`${id}/${slug}`}
            // FIXME: author info
            author={{
              avatar: '',
              name: '',
              link: '',
            }}
          />
        ),
      )}
      <Pagination onClick={handleSeeMore} hasNextPage={hasNextPage} />
    </section>
  );
};

export default Posts;
