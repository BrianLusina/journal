declare type PersonFilter = {
  AND?: PersonFilter[];
  company?: string;
  company_contains?: string;
  company_exists?: boolean;
  company_in?: string[];
  company_not?: string;
  company_not_contains?: string;
  company_not_in?: string[];
  contentfulMetadata?: ContentfulMetadataFilter;
  email?: string;
  email_contains?: string;
  email_exists?: boolean;
  email_in?: string[];
  email_not?: string;
  email_not_contains?: string;
  email_not_in?: string[];
  facebook?: string;
  facebook_contains?: string;
  facebook_exists?: boolean;
  facebook_in?: string[];
  facebook_not?: string;
  facebook_not_contains?: string;
  facebook_not_in?: string[];
  github?: string;
  github_contains?: string;
  github_exists?: boolean;
  github_in?: string[];
  github_not?: string;
  github_not_contains?: string;
  github_not_in?: string[];
  image_exists?: boolean;
  linkedIn?: string;
  linkedIn_contains?: string;
  linkedIn_exists?: boolean;
  linkedIn_in?: string[];
  linkedIn_not?: string;
  linkedIn_not_contains?: string;
  linkedIn_not_in?: string[];
  medium?: string;
  medium_contains?: string;
  medium_exists?: boolean;
  medium_in?: string[];
  medium_not?: string;
  medium_not_contains?: string;
  medium_not_in?: string[];
  name?: string;
  name_contains?: string;
  name_exists?: boolean;
  name_in?: string[];
  name_not?: string;
  name_not_contains?: string;
  name_not_in?: string[];
  OR?: PersonFilter[];
  phone?: string;
  phone_contains?: string;
  phone_exists?: boolean;
  phone_in?: string[];
  phone_not?: string;
  phone_not_contains?: string;
  phone_not_in?: string[];
  shortBio?: string;
  shortBio_contains?: string;
  shortBio_exists?: boolean;
  shortBio_in?: string[];
  shortBio_not?: string;
  shortBio_not_contains?: string;
  shortBio_not_in?: string[];
  sys?: SysFilter;
  tagline?: string;
  tagline_contains?: string;
  tagline_exists?: boolean;
  tagline_in?: string[];
  tagline_not?: string;
  tagline_not_contains?: string;
  tagline_not_in?: string[];
  title?: string;
  title_contains?: string;
  title_exists?: boolean;
  title_in?: string[];
  title_not?: string;
  title_not_contains?: string;
  title_not_in?: string[];
  twitter?: string;
  twitter_contains?: string;
  twitter_exists?: boolean;
  twitter_in?: string[];
  twitter_not?: string;
  twitter_not_contains?: string;
  twitter_not_in?: string[];
};

declare type PersonOrder =
  | 'name_ASC'
  | 'name_DESC'
  | 'tagline_ASC'
  | 'tagline_DESC'
  | 'title_ASC'
  | 'title_DESC'
  | 'company_ASC'
  | 'company_DESC'
  | 'email_ASC'
  | 'email_DESC'
  | 'phone_ASC'
  | 'phone_DESC'
  | 'facebook_ASC'
  | 'facebook_DESC'
  | 'twitter_ASC'
  | 'twitter_DESC'
  | 'github_ASC'
  | 'github_DESC'
  | 'linkedIn_ASC'
  | 'linkedIn_DESC'
  | 'medium_ASC'
  | 'medium_DESC'
  | 'sys_id_ASC'
  | 'sys_id_DESC'
  | 'sys_publishedAt_ASC'
  | 'sys_publishedAt_DESC'
  | 'sys_firstPublishedAt_ASC'
  | 'sys_firstPublishedAt_DESC'
  | 'sys_publishedVersion_ASC'
  | 'sys_publishedVersion_DESC';

declare type GetAuthorVariables = {} & GetItemVariables;

declare type GetAllAuthorsVariables = {
  where?: PersonFilter;
  order?: PersonOrder[];
} & GetAllItemsVariables;

declare type AuthorCollection = {
  items: Entry[];
  limit: number;
  skip: number;
  total: number;
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
  instagram?: string;
  role: string;
  linkedFrom: {
    entryCollection: {
      total: number;
    };
  };
  sys: Sys;
  image: Asset;
  contentfulMetadata: ContentfulMetadata;
};
