declare type PersonFilter = {
    AND?: PersonFilter[]
    company?: String
    company_contains?: String
    company_exists?: Boolean
    company_in?: String[]
    company_not?: String
    company_not_contains?: String
    company_not_in?: String[]
    contentfulMetadata?: ContentfulMetadataFilter
    email?: String
    email_contains?: String
    email_exists?: Boolean
    email_in?: String[]
    email_not?: String
    email_not_contains?: String
    email_not_in?: String[]
    facebook?: String
    facebook_contains?: String
    facebook_exists?: Boolean
    facebook_in?: String[]
    facebook_not?: String
    facebook_not_contains?: String
    facebook_not_in?: String[]
    github?: String
    github_contains?: String
    github_exists?: Boolean
    github_in?: String[]
    github_not?: String
    github_not_contains?: String
    github_not_in?: String[]
    image_exists?: Boolean
    linkedIn?: String
    linkedIn_contains?: String
    linkedIn_exists?: Boolean
    linkedIn_in?: String[]
    linkedIn_not?: String
    linkedIn_not_contains?: String
    linkedIn_not_in?: String[]
    medium?: String
    medium_contains?: String
    medium_exists?: Boolean
    medium_in?: String[]
    medium_not?: String
    medium_not_contains?: String
    medium_not_in?: String[]
    name?: String
    name_contains?: String
    name_exists?: Boolean
    name_in?: String[]
    name_not?: String
    name_not_contains?: String
    name_not_in?: String[]
    OR?: PersonFilter[]
    phone?: String
    phone_contains?: String
    phone_exists?: Boolean
    phone_in?: String[]
    phone_not?: String
    phone_not_contains?: String
    phone_not_in?: String[]
    shortBio?: String
    shortBio_contains?: String
    shortBio_exists?: Boolean
    shortBio_in?: String[]
    shortBio_not?: String
    shortBio_not_contains?: String
    shortBio_not_in?: String[]
    sys?: SysFilter
    tagline?: String
    tagline_contains?: String
    tagline_exists?: Boolean
    tagline_in?: String[]
    tagline_not?: String
    tagline_not_contains?: String
    tagline_not_in?: String[]
    title?: String
    title_contains?: String
    title_exists?: Boolean
    title_in?: String[]
    title_not?: String
    title_not_contains?: String
    title_not_in?: String[]
    twitter?: String
    twitter_contains?: String
    twitter_exists?: Boolean
    twitter_in?: String[]
    twitter_not?: String
    twitter_not_contains?: String
    twitter_not_in?: String[]    
}

declare type PersonOrder = 
    'name_ASC' |
    'name_DESC' |
    'tagline_ASC' |
    'tagline_DESC' |
    'title_ASC' |
    'title_DESC' |
    'company_ASC' |
    'company_DESC' |
    'email_ASC' |
    'email_DESC' |
    'phone_ASC' |
    'phone_DESC' |
    'facebook_ASC' |
    'facebook_DESC' |
    'twitter_ASC' |
    'twitter_DESC' |
    'github_ASC' |
    'github_DESC' |
    'linkedIn_ASC' |
    'linkedIn_DESC' |
    'medium_ASC' |
    'medium_DESC' |
    'sys_id_ASC' |
    'sys_id_DESC' |
    'sys_publishedAt_ASC' |
    'sys_publishedAt_DESC' |
    'sys_firstPublishedAt_ASC' |
    'sys_firstPublishedAt_DESC' |
    'sys_publishedVersion_ASC' |
    'sys_publishedVersion_DESC' 

declare type GetAuthorVariables = {} & GetItemVariables;

declare type GetAllAuthorsVariables = {
    where?: PersonFilter;
    order?: PersonOrder[];
} & GetAllItemsVariables;

declare type AuthorCollection = {
    items: Entry[];
    limit: number;
    skip: number;
    total: number  
};

declare type Author = {
    title: string;
    name: string;
    phone?: string;
    company: string;
    email?: string;
    facebook?: string;
    github: string;
    linkedin: string;
    medium: string;
    shortBio: string;
    tagline: string;
    twitter: string;
    sys: Sys
    image: Asset;
    contentfulMetadata: ContentfulMetadata;
}
