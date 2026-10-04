import { useQuery } from '@apollo/client';
import { GET_ALL_AUTHORS, GET_ALL_BLOGS_BY_CATEGORY, GET_ALL_BLOGS_BY_TAG, GET_AUTHOR, GET_BLOG } from '@contentfulClient';
import useFetchArticle from './useFetchArticle';
import useFetchArticlesByCategory from './useFetchArticlesByCategory';
import useFetchArticlesByTag from './useFetchArticlesByTag';
import useFetchAuthorById from './useFetchAuthorById';
import useFetchAuthors from './useFetchAuthors';
import useFetchAuthorsByIds from './useFetchAuthorsByIds';

jest.mock('@apollo/client', () => ({ ...(jest.requireActual('@apollo/client') as object), useQuery: jest.fn() }));
jest.mock('@contentfulClient', () => ({
  GET_ALL_AUTHORS: 'GET_ALL_AUTHORS',
  GET_ALL_BLOGS_BY_CATEGORY: 'GET_ALL_BLOGS_BY_CATEGORY',
  GET_ALL_BLOGS_BY_TAG: 'GET_ALL_BLOGS_BY_TAG',
  GET_AUTHOR: 'GET_AUTHOR',
  GET_BLOG: 'GET_BLOG',
}));

const error = new Error('down');

describe('Contentful fetch hooks', () => {
  beforeEach(() => {
    (useQuery as jest.Mock).mockReturnValue({ loading: false, error, data: { value: 1 } });
  });

  it('useFetchArticle queries a post by id', () => {
    expect(useFetchArticle('post-1')).toEqual([false, error, { value: 1 }]);
    expect(useQuery).toHaveBeenCalledWith(GET_BLOG, { variables: { id: 'post-1' } });
  });

  it('useFetchArticlesByCategory queries posts by category', () => {
    expect(useFetchArticlesByCategory('Travel')).toEqual([false, error, { value: 1 }]);
    expect(useQuery).toHaveBeenCalledWith(GET_ALL_BLOGS_BY_CATEGORY, { variables: { category: 'Travel' } });
  });

  it('useFetchArticlesByTag queries posts by tag', () => {
    expect(useFetchArticlesByTag('travel')).toEqual([false, error, { value: 1 }]);
    expect(useQuery).toHaveBeenCalledWith(GET_ALL_BLOGS_BY_TAG, { variables: { tag: 'travel' } });
  });

  it('useFetchAuthors queries every author', () => {
    expect(useFetchAuthors()).toEqual([false, error, { value: 1 }]);
    expect(useQuery).toHaveBeenCalledWith(GET_ALL_AUTHORS, { variables: {} });
  });

  it('useFetchAuthorById unwraps the person', () => {
    (useQuery as jest.Mock).mockReturnValue({ loading: false, data: { person: { name: 'Ada' } } });

    expect(useFetchAuthorById('a1')).toEqual([false, undefined, { name: 'Ada' }]);
    expect(useQuery).toHaveBeenCalledWith(GET_AUTHOR, { variables: { id: 'a1' } });
  });

  it('useFetchAuthorsByIds filters authors by id and unwraps the collection', () => {
    (useQuery as jest.Mock).mockReturnValue({ loading: true, data: undefined });

    expect(useFetchAuthorsByIds(['a1', 'a2'])).toEqual([true, undefined, undefined]);
    expect(useQuery).toHaveBeenCalledWith(GET_ALL_AUTHORS, { variables: { where: { sys: { id_in: ['a1', 'a2'] } } } });
  });
});
