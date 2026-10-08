import { gql } from '@apollo/client';

export const GET_SOCIAL_INFO = gql`
  query GetSocialInfo {
    socialCollection {
      items {
        name
        link
      }
    }
  }
`;
