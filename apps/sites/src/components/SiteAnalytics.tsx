import { useMemo, type FC } from 'react';
import { createAnalytics } from '@brianlusina/analytics';
import { ConsentBanner } from '@brianlusina/ui';

type Props = { site: 'home' | 'folio'; isProduction: boolean; measurementId: string | undefined };

/**
 * GA4 for a site, behind the consent banner. Nothing loads until the reader accepts, and outside
 * production nothing is sent at all (packages/analytics). Vercel Web Analytics runs separately.
 */
export const SiteAnalytics: FC<Props> = ({ site, isProduction, measurementId }) => {
  const analytics = useMemo(() => createAnalytics({ site, isProduction, measurementId }), [site, isProduction, measurementId]);
  const grant = () => {
    analytics.grant();
    analytics.pageview(window.location.pathname);
  };
  return <ConsentBanner onGrant={grant} />;
};
