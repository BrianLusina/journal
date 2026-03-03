import { Link, Navigate } from 'react-router-dom';
import config from '@/config';
import { CONTACT_PAGE_ROUTE } from '@/routes/links';
import PageLoader from '@/components/Elements/Loaders/PageLoader';
import useFetchAuthors from '@/hooks/api/useFetchAuthors';
import { captureException, captureScope, Severity } from '@/services/monitoring';
import { AuthorCardTile } from './components';

const AuthorsPage = () => {
  const [loading, error, data] = useFetchAuthors();

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    captureException(
      error,
      captureScope(
        { type: 'component', data: { component: 'ArticlesByTagPage', ...error } },
        Severity.Error,
      ),
    );
    // FIXME: use error boundary for a component instead
    return <p>Yikes! Something terrible has happened. Looking into this :)</p>;
  }

  if (!data) {
    return <Navigate to="/404" replace />;
  }

  const {
    personCollection: { items: authors },
  } = data || {};

  return (
    <>
      {/* Hero Section */}
      <div className="mb-16 text-center space-y-6">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight animate-slide-down">
          Meet Our Authors
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-slide-up stagger-1">
          The voices behind {config.title}—experienced writers, practitioners, and thoughtful
          explorers who bring diverse perspectives and genuine insights to every article.
        </p>
      </div>

      {/* Authors Grid */}
      <section className="grid md:grid-cols-2 gap-8 mb-16">
        {authors.map((author, index) => (
          <div
            key={author.name}
            className={`rounded-2xl bg-card p-8 hover:shadow-xl transition-all duration-300 animate-slide-up stagger-${Math.min(
              index + 2,
              6,
            )}`}
          >
            <AuthorCardTile
              name={author.name}
              imageUrl={author.image.url}
              role={author.role}
              bio={author.shortBio}
              articles={author.linkedFrom.entryCollection.total}
              twitter={author.twitter}
              linkedIn={author.linkedin}
              instagram={author.instagram}
              email={author.email}
              github={author.github}
              facebook={author.facebook}
            />
          </div>
        ))}
      </section>

      {/* Join Section */}
      <section className="text-center py-12 rounded-2xl bg-muted">
        <h2 className="text-3xl font-bold mb-4">Want to Contribute?</h2>
        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
          We're always looking for thoughtful voices to join our community. If you have insights to
          share on wellness, travel, creativity, or personal growth, we'd love to hear from you.
        </p>
        <Link
          to={CONTACT_PAGE_ROUTE}
          className="inline-block px-8 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          Get in Touch
        </Link>
      </section>
    </>
  );
};

export default AuthorsPage;
