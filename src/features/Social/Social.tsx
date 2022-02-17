import { FunctionComponent } from 'react';
import { useQuery } from '@apollo/client';
import { GET_SOCIAL_INFO } from '@graphQl/queries';
import { captureException, captureScope, Severity } from '@services/monitoring';
import SocialCard from '@components/SocialCard';

const Social: FunctionComponent = () => {
  const { loading, error, data } = useQuery<SocialsData>(GET_SOCIAL_INFO);

  // FIXME: use a component loader for this. Preferably a Skeleton loader
  if (loading) return <div>Loading...</div>;

  if (error) {
    // FIXME: use error boundary for a component instead
    captureException(
      error,
      captureScope({ type: 'component', data: { component: 'Blurb' } }, Severity.Error),
    );
    return <p>Yikes! Something terrible has happened. Looking into this :)</p>;
  }

  const socialItems = data ? data.socialCollection.items : [];

  return <SocialCard items={socialItems.map(({ name, link }) => ({ link, icon: name, name }))} />;
};

export default Social;
