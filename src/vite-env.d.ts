/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_TITLE: string
    readonly VITE_CMS_TOKEN: string
    readonly VITE_CMS_BASE_URL: string
    readonly VITE_CMS_GRAPHQL_URL: string
    readonly VITE_CMS_REST_API_URL: string
    // more env variables...
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}