import faker from 'faker';
import { render, screen } from '@testing-library/react';
import SocialIcon from './SocialIcon';

describe('SocialIcon', () => {
  it('should render with provided props', () => {
    const icon = faker.random.word();
    const link = faker.internet.url();
    const name = faker.random.word();
    render(<SocialIcon link={link} name={name} icon={icon} />);

    const nameElement = screen.getByText(name);
    const linkElement = screen.getByRole('link');

    expect(nameElement).toBeInTheDocument();
    expect(linkElement).toBeInTheDocument();
  });
});
