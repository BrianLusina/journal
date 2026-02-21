const CMS_API_KEY = import.meta.env.VITE_CMS_API_KEY
const CMS_BASE_URL  = import.meta.env.VITE_CMS_BASE_URL
const CMS_GRAPHQL_URL  = import.meta.env.VITE_CMS_GRAPHQL_URL
const CMS_REST_API_URL = import.meta.env.VITE_CMS_REST_API_URL
const CMS_PREVIEW_REST_API_URL = import.meta.env.VITE_CMS_PREVIEW_REST_API_URL
const CMS_SPACE_ID = import.meta.env.VITE_CMS_SPACE_ID
const CMS_ENVIRONMENT = import.meta.env.VITE_CMS_ENVIRONMENT
const CMS_PREVIEW = import.meta.env.VITE_CMS_PREVIEW

export default {
    apiKey: CMS_API_KEY || '',
    graphQlUrl: CMS_GRAPHQL_URL || 'https://graphql.contentful.com',
    restApiUrl: CMS_REST_API_URL || 'https://cdn.contentful.com',
    previewRestApiUrl: CMS_PREVIEW_REST_API_URL || 'https://preview.contentful.com',
    spaceId: CMS_SPACE_ID,
    environment: CMS_ENVIRONMENT || 'master',
    preview: CMS_PREVIEW === 'true'
}
