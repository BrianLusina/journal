import { gql } from '@apollo/client';
import { PersonFragment } from '../fragments';

export const GET_ALL_AUTHORS = gql`
  ${PersonFragment}

  query GetAllAuthors(
    $skip: Int
    $limit: Int
    $preview: Boolean
    $locale: String
    $where: PersonFilter
    $order: [PersonOrder]
  ) {
    personCollection(
      skip: $skip
      limit: $limit
      preview: $preview
      locale: $locale
      where: $where
      order: $order
    ) {
      total
      limit
      items {
        ...PersonFragment
      }
    }
  }
`;
