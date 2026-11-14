import { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GET_ABOUT_PAGES } from '@contentfulClient';
import { captureException, captureScope, Severity } from '@monitoring';
import MarkdownComponents from '@/components/ui/markdown';
import SubscribeForm from '@/features/NewsLetter/SubscribeForm';
import Feature from '@/components/Feature';
import config from '@config';

const AboutPage = () => {
  const { error, data } = useQuery<AboutPagesData>(GET_ABOUT_PAGES);

  // The about copy is optional, so a failed query is reported and the built-in copy stays.
  useEffect(() => {
    if (error) {
      captureException(
        error,
        captureScope({ type: 'component', data: { component: 'AboutPage' } }, Severity.Error),
      );
    }
  }, [error]);

  // we only need the first item in the collection.
  const about = data?.aboutCollection?.items?.[0];

  const title = about?.title;
  const content = about?.content;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="mb-16 text-center space-y-6">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight animate-slide-down">
          About {config.title}
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed animate-slide-up stagger-1">
          A space for exploring ideas, finding inspiration, and discovering new ways of seeing the
          world.
        </p>
      </div>

      {/* Story Section */}
      <section className="mb-16 space-y-6 text-muted-foreground animate-slide-up stagger-2">
        <h2 className="text-3xl font-bold text-foreground mb-6">{(content && title) || 'Our Story'}</h2>
        {content ? (
          <Markdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
            {content}
          </Markdown>
        ) : (
          <>
            <p>
              {config.title} began with a simple question: What if we could create a space where thoughtful
              ideas, meaningful stories, and practical wisdom come together to enrich our daily lives?
            </p>
            <p>
              In a world saturated with information, we felt the need for something different—a
              publication that prioritizes depth over speed, quality over quantity, and authentic
              connection over viral content. {config.title} is our answer to that need.
            </p>
            <p>
              We explore topics that matter: wellness practices that actually work, travel experiences
              that transform us, creative pursuits that bring joy, and personal growth strategies that
              lead to lasting change. Our approach is grounded in curiosity, backed by research, and
              enriched by lived experience.
            </p>
          </>
        )}
      </section>

      {/* CTA Section */}
      <Feature name="newsletter">
        <section className="text-center py-12 px-4 rounded-2xl bg-card">
          <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Subscribe to receive our latest articles, insights, and inspiration directly in your
            inbox.
          </p>
          <SubscribeForm />
        </section>
      </Feature>
    </div>
  );
};

export default AboutPage;
