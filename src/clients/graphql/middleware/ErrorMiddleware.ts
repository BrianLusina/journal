import { onError } from '@apollo/client/link/error';
import { captureSentryException, captureSentryScope } from '@/services/monitoring/sentry';

// Log any GraphQL errors or network error that occurred
const errorMiddleware = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.forEach(({ message, locations, path }) => {
      const errorMessage = `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      const scope = captureSentryScope(
        {
          type: 'graphql',
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          level: 'error',
          category: 'graphql',
          data: {
            message,
            locations,
            path,
          },
          message,
          timestamp: Date.now(),
        },
        'error',
      );
      captureSentryException(
        Error(errorMessage),
        scope,
        errorMessage,
      );
    });
  if (networkError) {
    captureSentryException(Error(`[Network Error]: : ${networkError}`));
  }
});

export default errorMiddleware;