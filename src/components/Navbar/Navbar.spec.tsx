import { render, screen } from '@testing-library/react';
import MockAppWithRouter from '@testUtils/MockAppWithRouter';
import navbarItems from './constants';
import Navbar from './Navbar';

describe('Navbar', () => {
  it('should render', () => {
    render(
      <MockAppWithRouter>
        <Navbar />
      </MockAppWithRouter>,
    );

    navbarItems.forEach((item) => {
      expect(screen.getByText(item.name)).toBeInTheDocument();
    });
  });
});
