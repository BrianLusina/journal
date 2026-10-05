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
    image {
      ...AssetFragment
    }
    name
    shortBio
    sys {
      ...SysFragment
    }
    linkedFrom {
		  entryCollection {
			  total
		  }
	  }
    tagline
    title
    role
    phone
    linkedIn
    medium
    twitter
    email
    facebook
    github
    github
    instagram
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
    # Bounded: Contentful prices an unbounded collection at its default limit of 100 per post,
    # and each author's linked image adds to that, which can exceed the query cost limit.
    authorsCollection(limit: 5) {
      items {
        sys {
          id
        }
        name
        shortBio
        image {
          url
        }
      }
    }
  }
`;
