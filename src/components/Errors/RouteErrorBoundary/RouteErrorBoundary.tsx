import { ComponentProps, ComponentType, FunctionComponent, PropsWithChildren } from 'react';
import { ErrorBoundary } from '@sentry/react';
import { RouteErrorBoundaryProps } from './RouteErrorBoundary.interface';

// @sentry/react 6 types its ErrorBoundary without `children`, which React 18's types no longer add
// to class components implicitly. It still renders `this.props.children`, so only the type is widened.
const SentryErrorBoundary = ErrorBoundary as ComponentType<
  PropsWithChildren<ComponentProps<typeof ErrorBoundary>>
>;

/**
 * Route Error Boundary that wraps Route components in an error boundary and captures errors
 * sending them to Sentry.
 * @param {RouteErrorBoundaryProps} props RouteErrorBoundary props
 * @returns ErrorBoundary component wrapped around a Route
 */
const RouteErrorBoundary: FunctionComponent<RouteErrorBoundaryProps> = ({
  location,
  children,
}: RouteErrorBoundaryProps) => {
  return (
    <SentryErrorBoundary
      beforeCapture={(scope) => {
        scope.setTag('location', location);
      }}
    >
      {children}
    </SentryErrorBoundary>
  );
};

export default RouteErrorBoundary;
