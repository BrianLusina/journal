import HeroSection from "@components/HeroSection";
import IntroSection from "@components/IntroSection";
import FeaturedArticles from "@/features/FeaturedArticles";
import NewsLetterSection from "@/features/NewsLetter";

const HomePage = () => {
  return (
    <>
      <HeroSection />
      <IntroSection />
      <FeaturedArticles />
      <NewsLetterSection />
    </>
  );
};

export default HomePage;
