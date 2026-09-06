import { gql } from '@apollo/client';
import { AssetFragment, ContentfulMetadataFragment, SysFragment, BlogFragment } from '../fragments';

export const GET_ALL_BLOGS = gql`
  ${AssetFragment}
  ${ContentfulMetadataFragment}
  ${SysFragment}
  ${BlogFragment}

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
        ...BlogFragment
      }
    }
  }
`;

export const GET_BLOG = gql`
  ${BlogFragment}
  query GetBlog($id: String!, $preview: Boolean, $locale: String) {
    blogPost(id: $id, preview: $preview, locale: $locale) {
      ...BlogFragment
    }
  }
`;

export const GET_ALL_BLOGS_BY_TAG = gql`
  ${BlogFragment}

  query GetAllBlogsByTag(
    $tag: String!
    $skip: Int
    $limit: Int
    $preview: Boolean
    $locale: String
    $order: [BlogPostOrder]
  ) {
    blogPostCollection(
      skip: $skip
      limit: $limit
      preview: $preview
      locale: $locale
      where: {contentfulMetadata: {tags: {id_contains_some: [$tag]}}}
      order: $order
    ) {
      total
      limit
      items {
        ...BlogFragment
      }
    }
  }
`;

export const GET_ALL_BLOGS_BY_CATEGORY = gql`
  ${BlogFragment}

  query GetAllBlogsByCategory(
    $category: String!
    $skip: Int
    $limit: Int
    $preview: Boolean
    $locale: String
    $order: [BlogPostOrder]
  ) {
    blogPostCollection(
      skip: $skip
      limit: $limit
      preview: $preview
      locale: $locale
      where: {category: $category}
      order: $order
    ) {
      total
      limit
      items {
        ...BlogFragment
      }
    }
  }
`;
