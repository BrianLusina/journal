import { ApolloError, useQuery } from '@apollo/client';
import { GET_ALL_BLOGS_BY_CATEGORY } from '@graphQl/queries';

export default function useFetchArticlesByCategory(category: string): [
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
    GetBlogByCategoryVariables
  >(GET_ALL_BLOGS_BY_CATEGORY, {
    variables: {
      category,
    },
  });

  return [loading, error, data];
}
