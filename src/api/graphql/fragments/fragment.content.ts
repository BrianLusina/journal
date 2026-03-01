import { gql } from '@apollo/client';
import { ContentfulMetadataFragment, AssetFragment, SysFragment } from './fragment.metadata';

export const PersonBioFragment = gql`
  fragment PersonBioFragment on PersonBio {
    json
  }
`;

export const PersonFragment = gql`
  ${PersonBioFragment}
  ${ContentfulMetadataFragment}
  ${AssetFragment}

  fragment PersonFragment on Person {
    _id
    bio {
      ...PersonBioFragment
    }
    company
    contentfulMetadata {
      ...ContentfulMetadataFragment
    }
    email
    facebook
    github
    image {
      ...AssetFragment
    }
    linkedIn
    medium
    name
    phone
    shortBio
    sys {
      ...SysFragment
    }
    tagline
    title
    twitter
  }
`;

export const BlogFragment = gql`
  ${AssetFragment}
  ${ContentfulMetadataFragment}
  ${SysFragment}

  fragment BlogFragment on BlogPost {
    heroImage {
      ...AssetFragment
    }
    thumbnail {
      ...AssetFragment
    }
    title
    subtitle
    description
    category
    slug
    body
    publishDate
    sys {
      ...SysFragment
    }
    contentfulMetadata {
      ...ContentfulMetadataFragment
    }
    authorsCollection {
      items {
        sys {
          id
        }
      }
    }
  }
`;
