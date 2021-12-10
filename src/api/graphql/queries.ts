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
    blogPostCollection {
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
