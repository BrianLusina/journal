import { Link } from '../link/LinkProvider';

// A tag page is addressed by the tag's name: it is the only identifier every source shares. The app
// decides where that page is.
const Tag: React.FC<{ name: string; href: string }> = ({ name, href }) => {
  return (
    <span className="px-4 py-2 rounded-full text-sm bg-muted text-foreground">
      <Link href={href}>#{name}</Link>
    </span>
  );
};

const Tags: React.FC<{ tags: string[]; hrefFor: (name: string) => string }> = ({ tags, hrefFor }) => {
  return (
    <div className="mb-12 pb-12 border-b border-border">
      <div className="flex flex-wrap gap-3">
        {tags.map((tag) => (
          <Tag key={tag} name={tag} href={hrefFor(tag)} />
        ))}
      </div>
    </div>
  );
};

export { Tag, Tags };
