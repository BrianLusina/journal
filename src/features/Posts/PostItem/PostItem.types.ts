type PostItemImage = {
  src: string;
  alt: string;
};

export type PostItemProps = {
  id: string;
  title: string;
  subtitle: string;
  excerpt: string;
  link: string;
  date: string;
  img: PostItemImage;
  tags: string[];
  authorIds: string[];
};
