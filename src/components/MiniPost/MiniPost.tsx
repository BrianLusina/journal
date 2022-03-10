import { FunctionComponent } from 'react';
import Link from '@components/Elements/Link';
import defaultMiniPic from '@assets/images/default_mini_pic.jpg';
import AuthorBadge from '@features/AuthorBadge';
import { MiniPostProps } from './MiniPost.types';

const MiniPost: FunctionComponent<MiniPostProps> = ({
  id,
  slug,
  link,
  title,
  authorIds,
  time,
  imgUrl,
}) => (
  <article id={id} className="mini-post">
    <header id={slug}>
      <h3>
        <Link to={link}>{title}</Link>
      </h3>
      <time className="published" dateTime={time}>
        {time}
      </time>
      {authorIds.map((authorId) => (
        <AuthorBadge key={authorId} authorId={authorId} />
      ))}
    </header>
    <Link to={link} className="image">
      <img id={id} src={imgUrl || defaultMiniPic} alt={title} />
    </Link>
  </article>
);

export default MiniPost;
