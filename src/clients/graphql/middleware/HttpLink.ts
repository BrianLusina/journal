import { HttpLink } from '@apollo/client';

const httpLink = (uri: string) => new HttpLink({
  uri,
});

export default httpLink;
