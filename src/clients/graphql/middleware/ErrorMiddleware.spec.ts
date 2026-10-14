import { ApolloLink, execute, gql, Observable } from '@apollo/client';
import { captureException, captureScope } from '@monitoring';
import errorMiddleware from './ErrorMiddleware';

// Reporting goes through the monitoring service, which loads the Sentry SDK after the first paint.
jest.mock('@monitoring', () => ({
  captureException: jest.fn(),
  captureScope: jest.fn(),
  Severity: { Error: 'error' },
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
    (captureScope as jest.Mock).mockReturnValue('scope');
  });

  it('reports each GraphQL error to Sentry with its scope', async () => {
    await run(
      new ApolloLink(() => Observable.of({ errors: [{ message: 'Bad field', locations: [], path: ['test'] }] as never })),
    );

    expect(captureScope).toHaveBeenCalledWith(expect.objectContaining({ type: 'graphql', message: 'Bad field' }), 'error');
    expect(captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Bad field') }),
      'scope',
      expect.stringContaining('[GraphQL error]'),
    );
  });

  it('reports network errors to Sentry', async () => {
    await run(new ApolloLink(() => new Observable(observer => observer.error(new Error('offline')))));

    expect(captureException).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('offline') }));
  });
});
