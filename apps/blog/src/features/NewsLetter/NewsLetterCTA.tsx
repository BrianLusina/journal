import SubscribeForm from './SubscribeForm';

type NewsLetterCTAProps = {
  title?: string;
  description?: string;
};

const NewsLetterCTA: React.FC<NewsLetterCTAProps> = ({ title, description }) => {
  return (
    <div className="mb-16 rounded-2xl bg-card p-8 md:p-12 text-center">
      <h3 className="text-2xl md:text-3xl font-bold mb-4">{title || "Enjoyed this article?"}</h3>
      <p className="text-muted-foreground mb-6">
        {description || "Subscribe to receive more insights like this directly in your inbox."}
      </p>
      <SubscribeForm />
    </div>
  );
};

export default NewsLetterCTA
