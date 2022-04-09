declare type BlogPostFilter = {
    AND: BlogPostFilter[];
    authorsCollection_exists: boolean;
    body: string;
    body_contains: string;
    body_exists: boolean;
    body_in: string[];
    body_not: string;
    body_not_contains: string;
    body_not_in: string[];
    category: string;
    category_contains: string;
    category_exists: boolean;
    category_in: string[];
    category_not: string;
    category_not_contains: string;
    category_not_in: string[];
    contentfulMetadata: ContentfulMetadataFilter;
    description: string;
    description_contains: string;
    description_exists: boolean;
    description_in: string[];
    description_not: string;
    description_not_contains: string;
    description_not_in: string[];
    heroImage_exists: boolean;
    OR: BlogPostFilter[];
    publishDate: DateTime;
    publishDate_exists: boolean;
    publishDate_gt: DateTime;
    publishDate_gte: DateTime;
    publishDate_in: DateTime[];
    publishDate_lt: DateTime;
    publishDate_lte: DateTime;
    publishDate_not: DateTime;
    publishDate_not_in: DateTime[];
    slug: string;
    slug_contains: string;
    slug_exists: boolean;
    slug_in: string[];
    slug_not: string;
    slug_not_contains: string;
    slug_not_in: string[];
    subtitle: string;
    subtitle_contains: string;
    subtitle_exists: boolean;
    subtitle_in: string[];
    subtitle_not: string;
    subtitle_not_contains: string;
    subtitle_not_in: string[];
    sys: SysFilter;
    tags_contains_all: string[];
    tags_contains_none: string[];
    tags_contains_some: string[];
    tags_exists: boolean;
    thumbnail_exists: boolean;
    title: string;
    title_contains: string;
    title_exists: boolean;
    title_in: string[];
    title_not: string;
    title_not_contains: string;
    title_not_in: string[];
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
'publishDate_ASC' |
'publishDate_DESC' |
'sys_id_ASC' |
'sys_id_DESC' |
'sys_publishedAt_ASC' |
'sys_publishedAt_DESC' |
'sys_firstPublishedAt_ASC' |
'sys_firstPublishedAt_DESC' |
'sys_publishedVersion_ASC' |
'sys_publishedVersion_DESC' 

declare type GetAllBlogsVariables = {
    skip?: number;
    limit?: number;
    preview?: boolean;
    locale?: string;
    where?: BlogPostFilter
    order?: BlogPostOrder[]
}

declare type GetBlogVariables = {} & GetItemVariables;

declare type BlogPostsData = {
    blogPostCollection: {
        total: number;
        limit: number;
        items: BlogPostItem[]
    }
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
    authorsCollection: AuthorCollection;
}
