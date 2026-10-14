import SubscribeForm from './SubscribeForm';

const NewsLetterSection = () => {
  return (
    <section className="my-20 rounded-[2.5rem] bg-card p-12 md:p-16 text-center animate-scale-in">
      <div className="max-w-2xl mx-auto space-y-8">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Stay inspired.</h2>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Subscribe to receive our latest articles and insights directly in your inbox.
        </p>
        <SubscribeForm />
      </div>
    </section>
  );
};

export default NewsLetterSection;
