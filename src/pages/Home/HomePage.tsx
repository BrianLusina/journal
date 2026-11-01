import {IntroSection, HeroSection } from "@components";
import {FeaturedArticles} from "@features";
import Feature from "@/components/Feature";
// Imported directly, not through @features: the entry chunk reaches that barrel, and the signup's
// zod schemas would come with it.
import NewsLetterSection from "@/features/NewsLetter";

const HomePage = () => {
  return (
    <>
      <HeroSection />
      <IntroSection />
      <FeaturedArticles />
      <Feature name="newsletter">
        <NewsLetterSection />
      </Feature>
    </>
  );
};

export default HomePage;
