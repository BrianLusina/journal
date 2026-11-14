const ArticleHeroImage: React.FC<{ imageUrl: string; title: string }> = ({ imageUrl, title }) => {
  return (
    <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] mb-12">
      <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
    </div>
  );
};

export default ArticleHeroImage;
