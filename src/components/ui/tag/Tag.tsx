const Tag: React.FC<{ name: string }> = ({ name }) => {
  return <span className="px-4 py-2 rounded-full text-sm bg-muted text-foreground">#{name}</span>;
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

export {
    Tag,
    Tags
};
