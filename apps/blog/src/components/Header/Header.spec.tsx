import { render, screen } from '@testing-library/react';
import MockAppWithRouter from '@testUtils/MockAppWithRouter';
import Header from './Header';

describe('Header', () => {
  it('renders its children in a banner', () => {
    render(
      <MockAppWithRouter>
        <Header>
          <p>Some Text</p>
        </Header>
      </MockAppWithRouter>,
    );

    expect(screen.getByRole('banner')).toContainElement(screen.getByText('Some Text'));
  });

  it('adds no site title of its own, leaving the logo to the navbar it wraps', () => {
    render(
      <MockAppWithRouter>
        <Header>
          <p>Some Text</p>
        </Header>
      </MockAppWithRouter>,
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
