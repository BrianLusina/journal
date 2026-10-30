import { FunctionComponent } from 'react';
import {Link} from '@components';
import defaultAvatar from '@/assets/images/avatar.jpg';
import { AUTHORS_PAGE_ROUTE } from '@/routes/links';

type AuthorBadgeProps = {
  author: UnifiedAuthor;
};

/**
 * Shows a post's author from the data the CMS adapter already returned. Only Contentful authors
 * have an author page, so only they are linked.
 */
const AuthorBadge: FunctionComponent<AuthorBadgeProps> = ({ author }) => {
  const { id, source, name, avatarUrl, shortBio } = author;

  if (!name) {
    return null;
  }

  const badge = (
    <div className="flex items-center gap-4">
      <img
        src={avatarUrl || defaultAvatar}
        alt={name}
        className="w-14 h-14 rounded-full object-cover"
      />
      <div>
        <p className="font-semibold">{name}</p>
        {shortBio && <p className="text-sm text-muted-foreground">{shortBio}</p>}
      </div>
    </div>
  );

  if (source !== 'contentful') {
    return <div className="author">{badge}</div>;
  }

  return (
    <Link to={`${AUTHORS_PAGE_ROUTE}/${id}`} className="author">
      {badge}
    </Link>
  );
};

export default AuthorBadge;
