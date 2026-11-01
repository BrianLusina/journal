import { render } from '@testing-library/react';
import * as Monitoring from '@monitoring';
import ErrorBoundary from './ErrorBoundary';

vi.mock('@monitoring', () => {
  return {
    captureAndLogError: vi.fn(),
    captureException: vi.fn(),
    captureScope: vi.fn(),
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
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    console.error.mockRestore();
  });

  afterEach(() => {
    vi.clearAllMocks();
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

    expect(console.error).toHaveBeenCalled();
  });
});
