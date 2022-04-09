import { ApolloError, useQuery } from '@apollo/client';
import { GET_AUTHOR } from '@graphQl/queries';

/**
 * Get author given their ids. This returns full author information
 * @param {String} authorId author id
 * @returns {[boolean, ApolloError | undefined] | { personCollection: Author[] } | undefined} 'Tuple' of [loading, error, data]
 */
export default function useFetchAuthorById(
  authorId: string,
): [boolean, ApolloError | undefined, Author | undefined] {
  const { loading, error, data } = useQuery<{ person: Author }, GetAuthorVariables>(GET_AUTHOR, {
    variables: {
      id: authorId,
    },
  });

  const { person: author } = data || {};

  return [loading, error, author];
}
