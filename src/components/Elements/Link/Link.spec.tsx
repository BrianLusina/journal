import { render, screen } from '@testing-library/react';
import MockAppWithRouter from '@testUtils/MockAppWithRouter';
import faker from 'faker';
import Link from './Link';

describe('Link', () => {
  it('should be able to render', () => {
    const path = faker.internet.url();
    const text = faker.lorem.word();
    render(
      <MockAppWithRouter>
        <Link to={path}>{text}</Link>
      </MockAppWithRouter>,
    );

    const textElement = screen.getByText(text);
    expect(textElement).toBeInTheDocument();

    const linkElement = screen.getByRole('link');
    expect(linkElement).toBeInTheDocument();
  });
});
