/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_TITLE: string
    readonly VITE_CMS_TOKEN: string
    readonly VITE_CMS_BASE_URL: string
    readonly VITE_CMS_GRAPHQL_URL: string
    readonly VITE_CMS_REST_API_URL: string
    readonly VITE_NOTION_API_KEY: string
    readonly VITE_NOTION_DATABASE_ID: string
    // more env variables...
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}