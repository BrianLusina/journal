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
    firstPublishedAt: DateTime
    firstPublishedAt_exists: boolean
    firstPublishedAt_gt: DateTime
    firstPublishedAt_gte: DateTime
    firstPublishedAt_in: [DateTime]
    firstPublishedAt_lt: DateTime
    firstPublishedAt_lte: DateTime
    firstPublishedAt_not: DateTime
    firstPublishedAt_not_in: [DateTime]
    id: string
    id_contains: string
    id_exists: boolean
    id_in: [string]
    id_not: string
    id_not_contains: string
    id_not_in: [string]
    publishedAt: DateTime
    publishedAt_exists: boolean
    publishedAt_gt: DateTime
    publishedAt_gte: DateTime
    publishedAt_in: [DateTime]
    publishedAt_lt: DateTime
    publishedAt_lte: DateTime
    publishedAt_not: DateTime
    publishedAt_not_in: [DateTime]
    publishedVersion: Float
    publishedVersion_exists: boolean
    publishedVersion_gt: Float
    publishedVersion_gte: Float
    publishedVersion_in: [Float]
    publishedVersion_lt: Float
    publishedVersion_lte: Float
    publishedVersion_not: Float
    publishedVersion_not_in: [Float]    
}

declare type ContentfulMetadataTagsFilter = {
    id_contains_all: [string];
    id_contains_none: [string];
    id_contains_some: [string];   
};

declare type ContentfulMetadataFilter = {
    tags: ContentfulMetadataTagsFilter;
    tags_exists: boolean;
};

declare type BlogPostFilter = {
    AND: [BlogPostFilter];
    authorsCollection_exists: boolean;
    body: string;
    body_contains: string;
    body_exists: boolean;
    body_in: [string];
    body_not: string;
    body_not_contains: string;
    body_not_in: [string];
    category: string;
    category_contains: string;
    category_exists: boolean;
    category_in: [string];
    category_not: string;
    category_not_contains: string;
    category_not_in: [string];
    contentfulMetadata: ContentfulMetadataFilter;
    description: string;
    description_contains: string;
    description_exists: boolean;
    description_in: [string];
    description_not: string;
    description_not_contains: string;
    description_not_in: [string];
    heroImage_exists: boolean;
    OR: [BlogPostFilter];
    publishDate: DateTime;
    publishDate_exists: boolean;
    publishDate_gt: DateTime;
    publishDate_gte: DateTime;
    publishDate_in: [DateTime];
    publishDate_lt: DateTime;
    publishDate_lte: DateTime;
    publishDate_not: DateTime;
    publishDate_not_in: [DateTime];
    slug: string;
    slug_contains: string;
    slug_exists: boolean;
    slug_in: [string];
    slug_not: string;
    slug_not_contains: string;
    slug_not_in: [string];
    subtitle: string;
    subtitle_contains: string;
    subtitle_exists: boolean;
    subtitle_in: [string];
    subtitle_not: string;
    subtitle_not_contains: string;
    subtitle_not_in: [string];
    sys: SysFilter;
    tags_contains_all: [string];
    tags_contains_none: [string];
    tags_contains_some: [string];
    tags_exists: boolean;
    thumbnail_exists: boolean;
    title: string;
    title_contains: string;
    title_exists: boolean;
    title_in: [string];
    title_not: string;
    title_not_contains: string;
    title_not_in: [string];
}

declare type BlogPostOrder = 
'title_ASC' |
'title_DESC' |
'subtitle_ASC' |
'subtitle_DESC' |
'category_ASC' |
'category_DESC' |
'slug_ASC' |
'slug_DESC' |
'publishDate_ASC'
'publishDate_DESC'
'sys_id_ASC'
'sys_id_DESC'
'sys_publishedAt_ASC'
'sys_publishedAt_DESC'
'sys_firstPublishedAt_ASC'
'sys_firstPublishedAt_DESC'
'sys_publishedVersion_ASC'
'sys_publishedVersion_DESC'

declare type GetAllBlogsVariables = {
    skip?: number;
    limit?: number;
    preview?: boolean;
    locale?: string;
    where?: BlogPostFilter
    order?: BlogPostOrder[]
}

declare type GetBlogVariables = {
    id: string;
    preview?: boolean;
    local?: string;
}

declare type AboutPageData = {
    title: string;
    content: string;
};

declare type AboutPagesData = {
    aboutCollection: {
        items: AboutPageData[]
    }
}

declare type SocialItem = {
    title: string;
    link: string;
}

declare type SocialsData = {
    socialCollection: {
        items: SocialItem[]
    }
}

declare type Author = {
    items: Entry[];
    limit: number;
    skip: number;
    total: number  
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

declare type BlogPostItem = {
    heroImage: Asset;
    thumbnail: Asset;
    title: string;
    subtitle: string;
    description: string;
    category: string;
    slug: string;
    body: string;
    publishDate: string;
    sys: Sys;
    contentfulMetadata: ContentfulMetadata;
    authorsCollection: Author[];
}

declare type BlogPostsData = {
    blogPostCollection: {
        total: number;
        limit: number;
        items: BlogPostItem[]
    }
}
