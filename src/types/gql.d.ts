declare type GetItemVariables = {
    id: string;
    preview?: boolean;
    locale?: string;
}

declare type GetAllItemsVariables = {
    skip?: number;
    limit?: number;
    preview?: boolean;
    locale?: string;
}

declare type Sys = {
    environmentId: string;
    id: string;
    firstPublishedAt: string;
    publishedAt: string;
    publishedVersion: number;
    spaceId: string;
}

declare type ContentfulTag = {
    id: string;
    name: string
}

declare type ContentfulMetadata = {
    tags: ContentfulTag[];
}

declare type Entry = {
    sys: Sys;
    contentfulMetaData: ContentfulMetadata;
};

declare type SysFilter = {
    firstPublishedAt?: DateTime
    firstPublishedAt_exists?: boolean
    firstPublishedAt_gt?: DateTime
    firstPublishedAt_gte?: DateTime
    firstPublishedAt_in?: DateTime[]
    firstPublishedAt_lt?: DateTime
    firstPublishedAt_lte?: DateTime
    firstPublishedAt_not?: DateTime
    firstPublishedAt_not_in?: DateTime[]
    id?: string
    id_contains?: string
    id_exists?: boolean
    id_in?: string[]
    id_not?: string
    id_not_contains?: string
    id_not_in?: string[]
    publishedAt?: DateTime
    publishedAt_exists?: boolean
    publishedAt_gt?: DateTime
    publishedAt_gte?: DateTime
    publishedAt_in?: DateTime[]
    publishedAt_lt?: DateTime
    publishedAt_lte?: DateTime
    publishedAt_not?: DateTime
    publishedAt_not_in?: DateTime[]
    publishedVersion?: Float
    publishedVersion_exists?: boolean
    publishedVersion_gt?: Float
    publishedVersion_gte?: Float
    publishedVersion_in?: Float[]
    publishedVersion_lt?: Float
    publishedVersion_lte?: Float
    publishedVersion_not?: Float
    publishedVersion_not_in?: Float[]
}

declare type ContentfulMetadataTagsFilter = {
    id_contains_all: string[];
    id_contains_none: string[];
    id_contains_some: string[];   
};

declare type ContentfulMetadataFilter = {
    tags: ContentfulMetadataTagsFilter;
    tags_exists: boolean;
};

declare type Asset = {
    contentfulMetadata: ContentfulMetadata;
    contentType: string;
    description: string;
    fileName: string;
    height: number;
    size: number;
    sys: Sys;
    title: string;
    url: string;
    width: number;    
}
