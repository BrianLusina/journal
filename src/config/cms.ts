const CONTENTFUL_CMS_API_KEY = import.meta.env.VITE_CONTENTFUL_CMS_API_KEY
const CONTENTFUL_CMS_BASE_URL  = import.meta.env.VITE_CONTENTFUL_CMS_BASE_URL
const CONTENTFUL_CMS_GRAPHQL_URL  = import.meta.env.VITE_CONTENTFUL_CMS_GRAPHQL_URL
const CONTENTFUL_CMS_REST_API_URL = import.meta.env.VITE_CONTENTFUL_CMS_REST_API_URL
const CONTENTFUL_CMS_PREVIEW_REST_API_URL = import.meta.env.VITE_CONTENTFUL_CMS_PREVIEW_REST_API_URL
const CONTENTFUL_CMS_SPACE_ID = import.meta.env.VITE_CONTENTFUL_CMS_SPACE_ID
const CONTENTFUL_CMS_ENVIRONMENT = import.meta.env.VITE_CONTENTFUL_CMS_ENVIRONMENT
const CONTENTFUL_CMS_PREVIEW = import.meta.env.VITE_CONTENTFUL_CMS_PREVIEW

export default {
  contentfulCms: {
    apiKey: CONTENTFUL_CMS_API_KEY || '',
    graphQlUrl: CONTENTFUL_CMS_GRAPHQL_URL || 'https://graphql.contentful.com',
    restApiUrl: CONTENTFUL_CMS_REST_API_URL || 'https://cdn.contentful.com',
    previewRestApiUrl: CONTENTFUL_CMS_PREVIEW_REST_API_URL || 'https://preview.contentful.com',
    spaceId: CONTENTFUL_CMS_SPACE_ID || '',
    environment: CONTENTFUL_CMS_ENVIRONMENT || 'master',
    preview: CONTENTFUL_CMS_PREVIEW === 'true',
  },
};
