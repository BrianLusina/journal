import config from '@config';
import graphQlClient from '@graphQlClient';

const {
  api: {
    cms: { graphQlUrl, spaceId, environment, apiKey },
  },
  env: { env },
} = config;

const uri =  `${graphQlUrl}/content/v1/spaces/${spaceId}/environments/${environment}`;

const client = graphQlClient({
  uri,
  authKey: apiKey,
});

export default client;
