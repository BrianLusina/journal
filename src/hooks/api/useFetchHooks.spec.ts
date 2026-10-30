import { useQuery } from '@apollo/client';
import { GET_ALL_AUTHORS } from '@contentfulClient';
import useFetchAuthors from './useFetchAuthors';
import useFetchAuthorsByIds from './useFetchAuthorsByIds';

jest.mock('@apollo/client', () => ({ ...(jest.requireActual('@apollo/client') as object), useQuery: jest.fn() }));
jest.mock('@contentfulClient', () => ({
  GET_ALL_AUTHORS: 'GET_ALL_AUTHORS',
}));

const error = new Error('down');

describe('Contentful fetch hooks', () => {
  beforeEach(() => {
    (useQuery as jest.Mock).mockReturnValue({ loading: false, error, data: { value: 1 } });
  });

  it('useFetchAuthors queries every author', () => {
    expect(useFetchAuthors()).toEqual([false, error, { value: 1 }]);
    expect(useQuery).toHaveBeenCalledWith(GET_ALL_AUTHORS, { variables: {} });
  });

  it('useFetchAuthorsByIds filters authors by id and unwraps the collection', () => {
    (useQuery as jest.Mock).mockReturnValue({ loading: true, data: undefined });

    expect(useFetchAuthorsByIds(['a1', 'a2'])).toEqual([true, undefined, undefined]);
    expect(useQuery).toHaveBeenCalledWith(GET_ALL_AUTHORS, { variables: { where: { sys: { id_in: ['a1', 'a2'] } } } });
  });
});
