import { render, screen } from '@testing-library/react';
import MockAppWithRouter from '@testUtils/MockAppWithRouter';
import ErrorMessage from './ErrorMessage';

describe('ErrorPage', () => {
  it('Should render & display text', () => {
    render(
      <MockAppWithRouter>
        <ErrorMessage />
      </MockAppWithRouter>,
    );

    const titleElement = screen.getByText('Oops! Well, this is embarassing...');
    expect(titleElement).toBeInTheDocument();
  });

  it('Should render & display custom title & message', () => {
    const title = 'Error';
    const message = 'Something went wrong';

    render(
      <MockAppWithRouter>
        <ErrorMessage title={title} message={message} />
      </MockAppWithRouter>,
    );

    const titleElement = screen.getByText(/Error/);
    expect(titleElement).toBeInTheDocument();

    const messageElement = screen.getByText(/Something went wrong/);
    expect(messageElement).toBeInTheDocument();
  });
});
