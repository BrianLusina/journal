import { ApolloClient, HttpLink, concat } from '@apollo/client';
import config from '@config';
import { authMiddleware, RetryMiddleware, Cache, errorMiddleware } from './middleware';

const {
  api: {
    cms: { graphQlUrl, spaceId, environment },
  },
  env: { env },
} = config;

const httpLink = new HttpLink({
  uri: `${graphQlUrl}/content/v1/spaces/${spaceId}/environments/${environment}`,
});

const client = new ApolloClient({
  link: concat(authMiddleware, RetryMiddleware.concat(httpLink)).concat(errorMiddleware),
  credentials: 'same-origin',
  cache: Cache,
  connectToDevTools: env === 'development',
});

export default client;
