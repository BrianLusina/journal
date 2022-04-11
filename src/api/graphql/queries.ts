import { gql } from '@apollo/client';

export const GET_ALL_BLOGS = gql`
  query GetAllBlogs(
    $skip: Int
    $limit: Int
    $preview: Boolean
    $locale: String
    $where: BlogPostFilter
    $order: [BlogPostOrder]
  ) {
    blogPostCollection(
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
        heroImage {
          title
          url
        }
        thumbnail {
          title
          url
        }
        title
        subtitle
        description
        category
        slug
        body
        publishDate
        sys {
          id
        }
        contentfulMetadata {
          tags {
            id
            name
          }
        }
        authorsCollection {
          items {
            sys {
              id
            }
          }
        }
      }
    }
  }
`;

export const GET_BLOG = gql`
  query GetBlog($id: String!, $preview: Boolean, $locale: String) {
    blogPost(id: $id, preview: $preview, locale: $locale) {
      heroImage {
        title
        url
      }
      thumbnail {
        title
        url
      }
      title
      subtitle
      description
      category
      slug
      body
      publishDate
      authorsCollection {
        items {
          sys {
            id
          }
        }
      }
      contentfulMetadata {
        tags {
          id
          name
        }
      }
    }
  }
`;

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

export const GET_AUTHOR = gql`
  query GetAuthor($id: String!, $preview: Boolean, $locale: String) {
    person(id: $id, preview: $preview, locale: $locale) {
      company
      email
      linkedIn
      title
      facebook
      github
      medium
      name
      twitter
      phone
      tagline
      shortBio
      sys {
        id
        publishedAt
        firstPublishedAt
      }
      image {
        url
        title
        description
      }
      contentfulMetadata {
        tags {
          id
          name
        }
      }
    }
  }
`;

export const GET_ALL_AUTHORS = gql`
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
        company
        email
        linkedIn
        title
        facebook
        github
        medium
        name
        twitter
        phone
        tagline
        shortBio
        sys {
          id
          publishedAt
          firstPublishedAt
        }
        image {
          url
          title
          description
        }
        contentfulMetadata {
          tags {
            id
            name
          }
        }
      }
    }
  }
`;
