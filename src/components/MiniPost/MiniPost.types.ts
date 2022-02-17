type Author = {
  link: string;
  slug: string;
  id: string;
  name: string;
  avatar: string;
};

export type MiniPostProps = {
  link: string;
  slug: string;
  id: string;
  title: string;
  authors: Author[];
  time: string;
  imgUrl: string;
};
