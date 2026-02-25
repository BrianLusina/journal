import { toast } from 'sonner';
import { Facebook, Twitter, Link2 } from 'lucide-react';

type MobileShareButtonsProps = {
  title: string;
};

const MobileShareButtons: React.FC<MobileShareButtonsProps> = ({ title }) => {
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="md:hidden mb-12 pb-12 border-b border-border">
      <p className="text-sm font-semibold mb-4">{title}</p>
      <div className="flex items-center gap-3">
        <button
          onClick={handleCopyLink}
          className="flex-1 py-3 rounded-full border border-border hover:border-primary hover:bg-muted transition-all flex items-center justify-center gap-2"
        >
          <Link2 className="w-4 h-4" />
          <span className="text-sm">Copy link</span>
        </button>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
            title,
          )}&url=${encodeURIComponent(window.location.href)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 rounded-full border border-border hover:border-primary hover:bg-muted transition-all flex items-center justify-center"
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
          className="w-12 h-12 rounded-full border border-border hover:border-primary hover:bg-muted transition-all flex items-center justify-center"
          aria-label="Share on Facebook"
        >
          <Facebook className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

export default MobileShareButtons;
