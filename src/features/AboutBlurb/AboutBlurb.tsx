import { FunctionComponent } from 'react';
import Link from '@components/Elements/Link';
import { useQuery } from '@apollo/client';
import { GET_ABOUT_PAGES } from '@graphQl/queries';
import { captureException, captureScope, Severity } from '@services/monitoring';
import Blurb from '@components/Blurb';

const AboutBlurb: FunctionComponent = () => {
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
    <Blurb title={title || 'About'} content={content || 'about'}>
      <ul className="actions">
        <li>
          <Link to="/about" className="button">
            Learn More
          </Link>
        </li>
      </ul>
    </Blurb>
  );
};

export default AboutBlurb;
