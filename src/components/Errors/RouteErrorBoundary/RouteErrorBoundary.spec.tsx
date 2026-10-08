import { render, screen } from '@testing-library/react';
import { captureAndLogError } from '@monitoring';
import RouteErrorBoundary from './RouteErrorBoundary';

// Every route waits for RouteErrorBoundary, so it must not pull the Sentry SDK into the first bundle.
jest.mock('@sentry/react', () => {
  throw new Error('RouteErrorBoundary loaded the Sentry SDK');
});
jest.mock('@monitoring', () => ({ captureAndLogError: jest.fn() }));

function Bomb(): null {
  throw new Error('boom');
}

describe('RouteErrorBoundary', () => {
  it('renders the route', () => {
    render(
      <RouteErrorBoundary location="/blog">
        <p>Route content</p>
      </RouteErrorBoundary>,
    );

    expect(screen.getByText('Route content')).toBeInTheDocument();
  });

  it('reports a crashed route tagged with its location and shows the error message', () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <RouteErrorBoundary location="/blog">
        <Bomb />
      </RouteErrorBoundary>,
    );

    expect(captureAndLogError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'boom' }),
      expect.objectContaining({ componentStack: expect.stringContaining('Bomb') }),
      { location: '/blog' },
    );
    expect(screen.getByText('Oops! Well, this is embarrassing...')).toBeInTheDocument();
  });
});
