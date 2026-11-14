import { ArrowLeft } from 'lucide-react';

type NavigationProps = {
  title: string;
  link: string;
};

const BackNavigation: React.FC<NavigationProps> = ({ title, link }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <a
        href={link}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {title}
      </a>
    </div>
  );
};

export { BackNavigation };
