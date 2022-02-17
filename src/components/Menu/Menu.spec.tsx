import { render } from '@testing-library/react';
import MockAppWithRouter from '@testUtils/MockAppWithRouter';
import Menu from './Menu';

describe('Menu', () => {
  it('should be able to render', () => {
    render(
      <MockAppWithRouter>
        <Menu />
      </MockAppWithRouter>,
    );
  });
});
