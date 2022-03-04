import { FunctionComponent } from 'react';
import Link from '@components/Elements/Link';
import { captureException, captureScope, Severity } from '@services/monitoring';
import useFetchAuthorById from '@hooks/api/useFetchAuthorById';
import defaultAvatar from '@assets/images/avatar.jpg';

type ArticleAuthorProps = {
  authorId: string;
};

const AuthorBadge: FunctionComponent<ArticleAuthorProps> = ({ authorId }) => {
  const [loading, error, data] = useFetchAuthorById(authorId);

  if (loading) {
    // TODO: set some loading state
    return <p>Loading...</p>;
  }

  if (error) {
    captureException(
      error,
      captureScope({ type: 'component', data: { component: 'ArticleAuthor' } }, Severity.Error),
    );
    // Let's return nothing in the event of an error
    return null;
  }

  if (!data) {
    // no authors, that's fine, display nothing
    return null;
  }

  const {
    name,
    image: { url, title },
  } = data;

  return (
    <Link key={authorId} to={`authors/${authorId}`} className="author">
      <span className="name">{name}</span>
      <img src={url || defaultAvatar} alt={title || name} />
    </Link>
  );
};

export default AuthorBadge;
