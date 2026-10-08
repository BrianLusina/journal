import { ApolloLink, execute, gql, Observable } from '@apollo/client';
import { captureSentryException, captureSentryScope } from '@/services/monitoring/sentry';
import errorMiddleware from './ErrorMiddleware';

jest.mock('@/services/monitoring/sentry', () => ({
  captureSentryException: jest.fn(),
  captureSentryScope: jest.fn(),
}));

const query = gql`
  query Test {
    test
  }
`;

const run = (terminating: ApolloLink) =>
  new Promise<void>(resolve => {
    execute(errorMiddleware.concat(terminating), { query }).subscribe({
      complete: resolve,
      error: () => resolve(),
    });
  });

describe('errorMiddleware', () => {
  beforeEach(() => {
    (captureSentryScope as jest.Mock).mockReturnValue('scope');
  });

  it('reports each GraphQL error to Sentry with its scope', async () => {
    await run(
      new ApolloLink(() => Observable.of({ errors: [{ message: 'Bad field', locations: [], path: ['test'] }] as never })),
    );

    expect(captureSentryScope).toHaveBeenCalledWith(expect.objectContaining({ type: 'graphql', message: 'Bad field' }), 'error');
    expect(captureSentryException).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Bad field') }),
      'scope',
      expect.stringContaining('[GraphQL error]'),
    );
  });

  it('reports network errors to Sentry', async () => {
    await run(new ApolloLink(() => new Observable(observer => observer.error(new Error('offline')))));

    expect(captureSentryException).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('offline') }));
  });
});
