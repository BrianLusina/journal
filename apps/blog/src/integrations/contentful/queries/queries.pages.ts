import { gql } from '@apollo/client';


export const GET_ABOUT_PAGES = gql`
  query GetAboutPages {
    aboutCollection {
      items {
        title
        content
      }
    }
  }
`;
