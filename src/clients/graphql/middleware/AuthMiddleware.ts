import { ApolloLink } from '@apollo/client';

const authMiddleware = (apiKey: string) => {
  return new ApolloLink((operation, forward) => {
    // add the authorization to the headers
    operation.setContext(({ headers = {} }) => ({
      headers: {
        ...headers,
        Authorization: `Bearer ${apiKey}`,
      },
    }));

    return forward(operation);
  })
};

export default authMiddleware;
