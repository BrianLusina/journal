/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_NAME: string
    readonly VITE_APP_TITLE: string
    readonly VITE_CONTENTFUL_CMS_TOKEN: string
    readonly VITE_CONTENTFUL_CMS_BASE_URL: string
    readonly VITE_CONTENTFUL_CMS_GRAPHQL_URL: string
    readonly VITE_CONTENFUL_CMS_REST_API_URL: string
    readonly VITE_ENV: string
    // Notion credentials are server-only (api/notion); never prefix them with VITE_.
    // more env variables...
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
