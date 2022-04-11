import { render } from '@testing-library/react';
import * as Monitoring from '@monitoring';
import ErrorBoundary from './ErrorBoundary';

jest.mock('@monitoring', () => {
  return {
    captureAndLogError: jest.fn(),
    captureException: jest.fn(),
    captureScope: jest.fn(),
    Severity: {
      Error: 'error',
    },
  };
});

function Bomb({ shouldThrow = false }: { shouldThrow: boolean }): null {
  if (shouldThrow) {
    throw new Error('💣');
  } else {
    return null;
  }
}

describe('ErrorBoundary', () => {
  beforeAll(() => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    console.error.mockRestore();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls captureAndLogError and renders there was an error', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );

    rerender(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );

    const error = expect.any(Error);
    const info = { componentStack: expect.stringContaining('Bomb') };

    expect(Monitoring.captureAndLogError).toHaveBeenCalledWith(error, info);
    expect(Monitoring.captureAndLogError).toHaveBeenCalledTimes(1);

    expect(console.error).toHaveBeenCalledTimes(2);
  });
});
