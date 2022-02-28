import { render, screen } from '@testing-library/react';
import faker from 'faker';
import Intro from './Intro';

describe('Intro', () => {
  it('should render with default props', () => {
    render(<Intro />);
  });

  it('should site title when passed in as a prop', () => {
    const title = faker.company.companyName();

    render(<Intro title={title} />);

    const titleElement = screen.getByText(title);

    expect(titleElement).toBeInTheDocument();
  });

  it('should display description when passed in as a prop', () => {
    const desc = faker.lorem.paragraph();

    render(<Intro desc={desc} />);

    const descElement = screen.getByText(desc);

    expect(descElement).toBeInTheDocument();
  });
});
