import { ApolloClient, HttpLink, concat } from '@apollo/client';
import config from '@config';
import authMiddleware from './AuthMiddleware';
import RetryMiddleware from './RetryMiddleware';
import Cache from './Cache';

const {
  api: {
    cms: { graphQlUrl },
  },
} = config;

const httpLink = new HttpLink({ uri: graphQlUrl });

const client = new ApolloClient({
  link: concat(authMiddleware, RetryMiddleware.concat(httpLink)),
  cache: Cache,
});

export default client;
