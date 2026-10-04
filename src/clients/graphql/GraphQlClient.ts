import { ApolloClient, concat, from } from '@apollo/client';
import config from '@config';
import { authMiddleware, RetryMiddleware, Cache, errorMiddleware, httpLink } from './middleware';

const {
  env: { env },
} = config;

type ClientParams = {
  uri: string;
  authKey?: string | null;
};

const graphQlClient = ({ uri, authKey }: ClientParams) => {
  const http = httpLink(uri);
  // HttpLink is terminating, so it must be last; anything after it never runs.
  let link = from([errorMiddleware, RetryMiddleware, http]);

  if (!authKey) {
    return new ApolloClient({
      link: link,
      credentials: 'same-origin',
      cache: Cache,
      connectToDevTools: env === 'development',
    });
  }

  link = concat(authMiddleware(authKey), link);

  return new ApolloClient({
    link,
    credentials: 'same-origin',
    cache: Cache,
    connectToDevTools: env === 'development',
  });
};

export default graphQlClient;
