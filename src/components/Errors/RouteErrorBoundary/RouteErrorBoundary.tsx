import { FunctionComponent } from 'react';
import { captureAndLogError } from '@monitoring';
import ErrorBoundary from '../ErrorBoundary';
import { RouteErrorBoundaryProps } from './RouteErrorBoundary.interface';

/**
 * Route Error Boundary that wraps Route components in an error boundary and captures errors
 * sending them to Sentry, tagged with the route's location. It reports through the monitoring
 * service rather than Sentry's own boundary so that the Sentry SDK can load after the first paint.
 * @param {RouteErrorBoundaryProps} props RouteErrorBoundary props
 * @returns ErrorBoundary component wrapped around a Route
 */
const RouteErrorBoundary: FunctionComponent<RouteErrorBoundaryProps> = ({
  location,
  children,
}: RouteErrorBoundaryProps) => {
  return (
    <ErrorBoundary onError={(error, errorInfo) => captureAndLogError(error, errorInfo, { location })}>
      {children}
    </ErrorBoundary>
  );
};

export default RouteErrorBoundary;
