import { Button } from '@/components/ui/button';

// TODO: Implement newsletter subscription logic (e.g., form handling, API integration)
const NewsLetterSection = () => {
  return (
    <section className="my-20 rounded-[2.5rem] bg-card p-12 md:p-16 text-center animate-scale-in">
      <div className="max-w-2xl mx-auto space-y-8">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Stay inspired.</h2>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Subscribe to receive our latest articles and insights directly in your inbox.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
          <input
            type="email"
            placeholder="Your email"
            className="flex-1 px-6 py-4 rounded-full border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
          <button className="px-10 py-4 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 hover:scale-105 transition-all">
            Subscribe
          </button>
        </div>
      </div>
    </section>
  );
};

export default NewsLetterSection;
