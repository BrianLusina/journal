import { gql } from '@apollo/client';

export const TaxonomyFragment = gql`
  fragment TaxonomyFragment on TaxonomyConcept {
    id
  }
`;

export const TagFragment = gql`
  fragment TagFragment on ContentfulTag {
    id
    name
  }
`;

export const ContentfulMetadataFragment = gql`
  ${TagFragment}
  ${TaxonomyFragment}

  fragment ContentfulMetadataFragment on ContentfulMetadata {
    concepts {
      ...TaxonomyFragment
    }
    tags {
      ...TagFragment
    }
  }
`;

export const SysFragment = gql`
  fragment SysFragment on Sys {
    environmentId
    firstPublishedAt
    id
    locale
    publishedAt
    publishedVersion
    spaceId
  }
`;

export const AssetFragment = gql`
  ${ContentfulMetadataFragment}
  ${SysFragment}

  fragment AssetFragment on Asset {
    contentfulMetadata {
      ...ContentfulMetadataFragment
    }
    contentType
    description
    fileName
    height
    size
    sys {
      ...SysFragment
    }
    title
    url
    width
  }
`;
