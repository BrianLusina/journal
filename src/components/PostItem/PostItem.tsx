import { FunctionComponent } from 'react';
import Link from '@components/Elements/Link';
import kebabCase from 'lodash/kebabCase';
import defaultAvatar from '@assets/images/avatar.jpg';
import defaultFeature from '@assets/images/default_feature_pic.jpg';
import ButtonLink from '@components/Elements/ButtonLink';
import { PostItemProps } from './PostItem.types';

const PostItem: FunctionComponent<PostItemProps> = ({
  title,
  subtitle,
  date,
  link,
  excerpt,
  img: { src, alt },
  author: { name, avatar, link: authorLink },
  tags,
}) => (
  <article className="post">
    <header>
      <div className="title">
        <h2>
          <Link to={link}>{title}</Link>
        </h2>
        <p>{subtitle}</p>
      </div>
      <div className="meta">
        <time className="published" dateTime={date}>
          {date}
        </time>
        <Link to={`about/#${authorLink}`} className="author">
          <span className="name">{name}</span>
          <img src={avatar || defaultAvatar} alt={name} />
        </Link>
      </div>
    </header>

    <Link to={link} className="image featured">
      <img src={src || defaultFeature} alt={alt} />
    </Link>

    <p>{excerpt}</p>

    <footer>
      <ul className="actions">
        <li>
          <ButtonLink path={link} text="Continue Reading" />
        </li>
      </ul>
      <ul className="stats">
        <li>
          {tags.map((tag) => (
            <Link key={tag} to={`tags/${kebabCase(tag)}`}>
              {tag}
            </Link>
          ))}
        </li>
        {/* <li>
					<a href="#" className="icon fa-heart">
						28
					</a>
				</li>
				<li>
					<a href="#" className="icon fa-comment">
						128
					</a>
				</li> */}
      </ul>
    </footer>
  </article>
);

export default PostItem;
