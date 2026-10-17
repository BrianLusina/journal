import {IntroSection, HeroSection } from "@components";
import {FeaturedArticles} from "@features";
// Imported directly, not through @features: the entry chunk reaches that barrel, and the signup's
// zod schemas would come with it.
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
