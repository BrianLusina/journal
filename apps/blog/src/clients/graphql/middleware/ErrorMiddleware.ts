import { onError } from '@apollo/client/link/error';
import { captureException, captureScope, Severity } from '@monitoring';

// Log any GraphQL errors or network error that occurred
const errorMiddleware = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.forEach(({ message, locations, path }) => {
      const errorMessage = `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      const scope = captureScope(
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
        Severity.Error,
      );
      captureException(
        Error(errorMessage),
        scope,
        errorMessage,
      );
    });
  if (networkError) {
    captureException(Error(`[Network Error]: : ${networkError}`));
  }
});

export default errorMiddleware;