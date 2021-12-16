type PostItemImage = {
  src: string;
  alt: string;
};

type PostAuthor = {
  avatar: string;
  name: string;
  link: string;
};

export type PostItemProps = {
  title: string;
  subtitle: string;
  excerpt: string;
  link: string;
  date: string;
  img: PostItemImage;
  tags: string[];
  author: PostAuthor;
};
