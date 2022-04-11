import { ApolloError, useQuery } from '@apollo/client';
import { GET_ALL_AUTHORS } from '@graphQl/queries';

/**
 * Get all authors given their ids. This returns full author information
 * @param {String[]} authorIds Array or author IDs
 * @returns {[boolean, ApolloError | undefined] |} 'Tuple' of [loading, error, data]
 */
export default function useFetchAuthorsByIds(
  authorIds: string[],
): [boolean, ApolloError | undefined, Author[] | undefined] {
  const { loading, error, data } = useQuery<{ personCollection: Author[] }, GetAllAuthorsVariables>(
    GET_ALL_AUTHORS,
    {
      variables: {
        where: {
          sys: {
            id_in: authorIds,
          },
        },
      },
    },
  );

  const { personCollection: authors } = data || {};

  return [loading, error, authors];
}
