import { HttpLink } from '@apollo/client';

const httpLink = (uri: string) => new HttpLink({
  uri,
  credentials: 'same-origin',
});

export default httpLink;
