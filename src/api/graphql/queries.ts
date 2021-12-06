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
        tags
        category
        slug
        body
        publishDate
        sys {
         id
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
      tags
      category
      slug
      body
      publishDate
    }
  }
`;
