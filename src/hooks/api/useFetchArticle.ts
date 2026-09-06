import { ApolloError, useQuery } from '@apollo/client';
import { GET_BLOG } from '@contentfulClient';

export default function useFetchArticle(id: string): [
  boolean,
  ApolloError | undefined,
  (
    | {
        blogPost: BlogPostItem;
      }
    | undefined
  ),
] {
  const { loading, error, data } = useQuery<{ blogPost: BlogPostItem }, GetBlogVariables>(
    GET_BLOG,
    {
      variables: {
        id,
      },
    },
  );

  return [loading, error, data];
}
