import {IntroSection, HeroSection } from "@components";
import {FeaturedArticles, NewsLetterSection} from "@features";

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
