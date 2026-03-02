import { ARTICLE_PAGE_BY_TAGS_ROUTE } from '@/routes/links';
import { camelCase } from 'lodash';
import { Link } from 'react-router-dom';

const Tag: React.FC<{ name: string }> = ({ name }) => {
  const tagSlug = camelCase(name)

  return (
    <span className="px-4 py-2 rounded-full text-sm bg-muted text-foreground">
      <Link to={`${ARTICLE_PAGE_BY_TAGS_ROUTE}/${tagSlug}`}>#{name}</Link>
    </span>
  );
};

const Tags: React.FC<{ tags: { id: string; name: string }[] }> = ({ tags }) => {
  return (
    <div className="mb-12 pb-12 border-b border-border">
      <div className="flex flex-wrap gap-3">
        {tags.map((tag) => (
          <Tag key={tag.id} name={tag.name} />
        ))}
      </div>
    </div>
  );
};

export { Tag, Tags };
