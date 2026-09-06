import { Facebook, Twitter, Linkedin, Link2 } from 'lucide-react';
import {AuthorBadge} from '@features';
import { getCategoryClass } from '@/lib/utils';
import { toast } from 'sonner';

type ArticleHeaderProps = {
    title: string;
    subtitle: string;
    category: string;
    publishedDate: string;
    authors: UnifiedAuthor[];
};

const ArticleHeader: React.FC<ArticleHeaderProps> = ({
  title,
  subtitle,
  category,
  publishedDate,
  authors,
}) => {
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="mb-12 animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <span
          className={`px-4 py-2 rounded-full text-sm font-medium ${getCategoryClass(category)}`}
        >
          {category}
        </span>
        <span className="text-sm text-muted-foreground">{publishedDate}</span>
        <span className="text-sm text-muted-foreground">•</span>
        {/* TODO: add read time */}
        {/* <span className="text-sm text-muted-foreground">{article.readTime} read</span> */}
      </div>

      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">{title}</h1>

      <p className="text-xl text-muted-foreground mb-8">{subtitle}</p>

      {/* Author Info */}
      <div className="flex items-center justify-between border-t border-b border-border py-6">
        <div className="flex items-center gap-4">
          {authors.map((author) => (
            <AuthorBadge key={author.id} authorId={author.id} />
          ))}
        </div>

        {/* Share Buttons */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="w-10 h-10 rounded-full border border-border hover:border-primary hover:bg-muted transition-all flex items-center justify-center"
            aria-label="Copy link"
          >
            <Link2 className="w-4 h-4" />
          </button>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
              title,
            )}&url=${encodeURIComponent(window.location.href)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full border border-border hover:border-primary hover:bg-muted transition-all flex items-center justify-center"
            aria-label="Share on Twitter"
          >
            <Twitter className="w-4 h-4" />
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              window.location.href,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full border border-border hover:border-primary hover:bg-muted transition-all flex items-center justify-center"
            aria-label="Share on Facebook"
          >
            <Facebook className="w-4 h-4" />
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
              window.location.href,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full border border-border hover:border-primary hover:bg-muted transition-all flex items-center justify-center"
            aria-label="Share on LinkedIn"
          >
            <Linkedin className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ArticleHeader;
