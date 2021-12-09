import { FunctionComponent } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_ABOUT_PAGES } from '@graphQl/queries';
import { captureException, captureScope, Severity } from '@services/monitoring';

const Blurb: FunctionComponent = () => {
  const { loading, error, data } = useQuery<AboutPagesData>(GET_ABOUT_PAGES);

  // FIXME: use component loader instead
  if (loading) return <p>Loading...</p>;

  if (error) {
    // FIXME: use error boundary for a component instead
    captureException(
      error,
      captureScope({ type: 'component', data: { component: 'Blurb' } }, Severity.Error),
    );
    return <p>Yikes! Something terrible has happened. Looking into this :)</p>;
  }

  // we only need the first item in the collection.
  const about = data?.aboutCollection.items[0];

  const title = about?.title;
  const content = about?.content;

  return (
    <section className="blurb">
      <h2>{title || 'About'}</h2>
      <p>{content || 'about'}</p>
      <ul className="actions">
        <li>
          <Link to="/about" className="button">
            Learn More
          </Link>
        </li>
      </ul>
    </section>
  );
};

export default Blurb;
