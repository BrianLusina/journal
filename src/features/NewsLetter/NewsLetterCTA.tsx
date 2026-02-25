import { Button } from '@/components/ui/button';

type NewsLetterCTAProps = {
  title?: string;
  description?: string;
};

// TODO: Implement newsletter subscription logic (e.g., form handling, API integration)
const NewsLetterCTA: React.FC<NewsLetterCTAProps> = ({ title, description }) => {
  return (
    <div className="mb-16 rounded-2xl bg-card p-8 md:p-12 text-center">
      <h3 className="text-2xl md:text-3xl font-bold mb-4">{title || "Enjoyed this article?"}</h3>
      <p className="text-muted-foreground mb-6">
        {description || "Subscribe to receive more insights like this directly in your inbox."}
      </p>
      <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
        <input
          type="email"
          placeholder="Your email"
          className="flex-1 px-4 py-3 rounded-full border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8">
          Subscribe
        </Button>
      </div>
    </div>
  );
};

export default NewsLetterCTA