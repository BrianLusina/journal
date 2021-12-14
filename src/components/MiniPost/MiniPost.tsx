import { FunctionComponent } from 'react';
import Link from '@components/Elements/Link';
import defaultAvatar from '@assets/images/avatar.jpg';
import defaultMiniPic from '@assets/images/default_mini_pic.jpg';
import { MiniPostProps } from './MiniPost.types';

const MiniPost: FunctionComponent<MiniPostProps> = ({
  id,
  slug,
  link,
  title,
  author: { link: authorLink, id: authorId, name, avatar },
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
      <Link to={authorLink} className="author">
        <img id={authorId} src={avatar || defaultAvatar} alt={name} />
      </Link>
    </header>
    <Link to={link} className="image">
      <img id={id} src={imgUrl || defaultMiniPic} alt={title} />
    </Link>
  </article>
);

export default MiniPost;
