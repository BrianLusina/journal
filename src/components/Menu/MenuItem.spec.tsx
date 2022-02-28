import { render, screen } from '@testing-library/react';
import MockAppWithRouter from '@testUtils/MockAppWithRouter';
import faker from 'faker';
import MenuItem from './MenuItem';

describe('MenuItem', () => {
  it('should be able to mount', () => {
    const link = faker.internet.url();
    const title = faker.lorem.word();
    const description = faker.lorem.sentence();

    render(
      <MockAppWithRouter>
        <MenuItem link={link} title={title} description={description} />
      </MockAppWithRouter>,
    );

    const titleElement = screen.getByText(title);
    expect(titleElement).toBeInTheDocument();

    const descriptionElement = screen.getByText(description);
    expect(descriptionElement).toBeInTheDocument();

    const linkElement = screen.getByRole('link');
    expect(linkElement).toBeInTheDocument();
  });
});
