import ArticleCard from '@/components/ArticleCard';
// import { articles } from "@/data/articles";

const FeaturedArticles = () => {
  // TODO: fetch featured articles from API
  const featuredArticles = [].slice(0, 6);

  return (
    <section id="articles" className="py-12">
      <div className="flex items-center justify-between mb-12 animate-slide-up">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Featured Articles</h2>
        <a
          href="#all"
          className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors px-4 py-2 rounded-full hover:bg-muted/60"
        >
          View all →
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {featuredArticles.map((article, index) => (
          <div key={article.id} className={`animate-slide-up stagger-${Math.min(index + 1, 6)}`}>
            <ArticleCard {...article} size="small" />
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturedArticles;
