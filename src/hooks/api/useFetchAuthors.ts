import { ApolloError, useQuery } from '@apollo/client';
import { GET_ALL_AUTHORS } from '@graphQl/queries';

/**
 * Get all authors
 * @returns {[boolean, ApolloError | undefined] | { personCollection: Author[] } | undefined} 'Tuple' of [loading, error, data]
 */
export default function useFetchAuthors(): [
  boolean,
  ApolloError | undefined,
  (
    | {
        personCollection: {
          items: Author[];
        };
      }
    | undefined
  ),
] {
  const { loading, error, data } = useQuery<{ personCollection: { items: Author[] } }>(
    GET_ALL_AUTHORS,
    {
      variables: {},
    },
  );

  return [loading, error, data];
}
