import faker from 'faker';
import { render, screen } from '@testing-library/react';
import config from '@config';
import MockAppWithRouter from '@testUtils/MockAppWithRouter';
import Header from './Header';

describe('Header', () => {
  it('should be able to render with default props', () => {
    render(
      <MockAppWithRouter>
        <Header>
          <p>Some Text</p>
        </Header>
      </MockAppWithRouter>,
    );

    const titleElement = screen.getByText(config.title);
    expect(titleElement).toBeInTheDocument();
  });

  it('should render with passed in title prop', () => {
    const title = faker.random.word();
    render(
      <MockAppWithRouter>
        <Header title={title}>
          <p>Some Text</p>
        </Header>
      </MockAppWithRouter>,
    );

    const titleElement = screen.getByText(title);
    expect(titleElement).toBeInTheDocument();

    const someTitleElement = screen.getByText('Some Text');
    expect(someTitleElement).toBeInTheDocument();
  });
});
