import faker from 'faker';
import { render, screen } from '@testing-library/react';
import SocialCard from './SocialCard';

describe('SocialCard', () => {
  it('should render with provided props', () => {
    const icon = faker.random.word();
    const link = faker.internet.url();
    const name = faker.random.word();
    const items = [
      {
        icon,
        link,
        name,
      },
    ];

    render(<SocialCard items={items} />);

    const nameElement = screen.getByText(name);
    const linkElement = screen.getByRole('link');

    expect(nameElement).toBeInTheDocument();
    expect(linkElement).toBeInTheDocument();
  });
});
