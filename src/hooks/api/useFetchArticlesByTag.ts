import { ApolloError, useQuery } from '@apollo/client';
import { GET_ALL_BLOGS_BY_TAG } from '@graphQl/queries';

export default function useFetchArticlesByTag(tag: string): [
  boolean,
  ApolloError | undefined,
  (
    | {
        blogPostCollection: {
          items: BlogPostItem[];
        };
      }
    | undefined
  ),
] {
  const { loading, error, data } = useQuery<
    { blogPostCollection: { items: BlogPostItem[] } },
    GetBlogByTagVariables
  >(GET_ALL_BLOGS_BY_TAG, {
    variables: {
      tag: tag,
    },
  });

  return [loading, error, data];
}
