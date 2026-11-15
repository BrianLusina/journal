import { render, screen } from '@testing-library/react';
import MockAppWithRouter from '@testUtils/MockAppWithRouter';
import faker from 'faker';
import ButtonLink from './ButtonLink';

describe('ButtonLink', () => {
  it('should be able to mount', () => {
    const path = faker.internet.url();
    const text = faker.lorem.word();
    render(
      <MockAppWithRouter>
        <ButtonLink text={text} path={path} />
      </MockAppWithRouter>,
    );

    const textElement = screen.getByText(text);
    expect(textElement).toBeInTheDocument();
  });
});
