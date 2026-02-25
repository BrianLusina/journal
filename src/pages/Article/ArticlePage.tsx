import { FunctionComponent } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { captureException, captureScope, Severity } from '@services/monitoring';
import PageLoader from '@components/Elements/Loaders/PageLoader';
import { humanizeDateTime } from '@timeUtils';
import useFetchArticle from '@hooks/api/useFetchArticle';
import { DATE_TIME_FORMAT_YYYY_MM_DD_hh_mm_ss, DATE_FORMAT_MMMM_D_YYYY } from '@timeConstants';
import { BackNavigation } from '@/components/ui/navigation';
import { ArticleHeader, ArticleHeroImage } from './components';
import { Tags } from '@/components/ui/tag';
import { NewsLetterCTA } from '@/features/NewsLetter';
import MobileShareButtons from '@/components/ui/share';

const ArticlePage: FunctionComponent = () => {
  const { slug, id } = useParams();
  const [loading, error, data] = useFetchArticle(id!);

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    captureException(
      error,
      captureScope({ type: 'component', data: { component: 'ArticlePage' } }, Severity.Error),
    );
    // FIXME: use error boundary for a component instead
    return <p>Yikes! Something terrible has happened. Looking into this :)</p>;
  }

  if (!data) {
    return <Navigate to="/404" replace />;
  }

  const {
    heroImage: { url: imageUrl },
    title,
    subtitle,
    publishDate,
    body,
    category,
    contentfulMetadata: { tags },
    authorsCollection: { items: authors },
  } = data.blogPost;

  const publishDateHumanized = humanizeDateTime(
    publishDate,
    DATE_TIME_FORMAT_YYYY_MM_DD_hh_mm_ss,
    DATE_FORMAT_MMMM_D_YYYY,
  );

  return (
    <main>
      <BackNavigation title="Back to Articles" link="/articles" />

      <ArticleHeroImage imageUrl={imageUrl} title={title} />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10">
        <ArticleHeader
          title={title}
          subtitle={subtitle}
          category={category}
          publishedDate={publishDateHumanized}
          authors={authors}
        />

        {/* Article Content */}
        <div className="prose prose-lg max-w-none mb-16 animate-slide-up stagger-2">
          <p className="text-lg leading-relaxed text-muted-foreground mb-8">{subtitle}</p>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>

          {/* {content.sections.map((section, index) => (
            <div key={index} className="mb-10">
              <h2 className="text-3xl font-bold mb-4">{section.heading}</h2>
              <p className="text-lg leading-relaxed text-muted-foreground">
                {section.content}
              </p>
            </div>
          ))}

          <div className="mt-12 p-6 rounded-2xl bg-muted border-l-4 border-accent">
            <p className="text-lg leading-relaxed italic text-foreground">
              {content.conclusion}
            </p>
          </div> */}
        </div>

        <Tags tags={tags} />
        <MobileShareButtons title={'Share this article'} />
        <NewsLetterCTA />
      </article>
    </main>
  );
};

export default ArticlePage;
