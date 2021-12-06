import { ApolloLink } from '@apollo/client';
import config from '@config';

const { api: { cms: { apiKey }} } = config;

const authMiddleware = new ApolloLink((operation, forward) => {
  // add the authorization to the headers
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      Authorization: `Bearer ${apiKey}`,
    },
  }));

  return forward(operation);
});

export default authMiddleware;
