import analytics from '@analytics';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Tracks page views for the current user: one per page, not per change of its query, which the
 * search page rewrites on every keystroke.
 */
export default function usePageViews(): void {
  const location = useLocation();
  useEffect(() => {
    analytics.logEvent('page_view', {
      page_path: location.pathname,
    });
  }, [location.pathname]);
}
