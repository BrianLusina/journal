// The post models live in @brianlusina/cms. These aliases keep them global in the blog, as they were
// before the package existed, so code under src/ uses them without an import. No top-level import or
// export here: that would turn this file into a module and the names would stop being global.

declare type CMSSource = import('@brianlusina/cms').CMSSource;
declare type UnifiedAuthor = import('@brianlusina/cms').UnifiedAuthor;
declare type UnifiedAsset = import('@brianlusina/cms').UnifiedAsset;
declare type UnifiedPost = import('@brianlusina/cms').UnifiedPost;
declare type CMSPostFilter = import('@brianlusina/cms').CMSPostFilter;
declare type CMSPaginationOptions = import('@brianlusina/cms').CMSPaginationOptions;
declare type PaginatedUnifiedPosts = import('@brianlusina/cms').PaginatedUnifiedPosts;
declare type CMSPageRequest = import('@brianlusina/cms').CMSPageRequest;
declare type CMSPage = import('@brianlusina/cms').CMSPage;
