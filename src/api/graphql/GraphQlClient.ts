import { ApolloClient, HttpLink, concat } from '@apollo/client';
import config from '@config';
import authMiddleware from './AuthMiddleware';
import RetryMiddleware from './RetryMiddleware';
import Cache from './Cache';

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
  link: concat(authMiddleware, RetryMiddleware.concat(httpLink)),
  credentials: 'same-origin',
  cache: Cache,
  connectToDevTools: env === 'development',
});

export default client;
