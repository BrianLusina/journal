import faker from 'faker';
import { render, screen } from '@testing-library/react';
import AboutBlurb from './Blurb';

describe('Blurb', () => {
  it('should render', () => {
    const paragraph = faker.lorem.paragraph();
    const title = faker.lorem.sentence();
    render(<AboutBlurb title={title} content={paragraph} />);

    const paragraphTextElement = screen.getByText(paragraph);
    const titleTextElement = screen.getByText(title);

    expect(paragraphTextElement).toBeInTheDocument();
    expect(titleTextElement).toBeInTheDocument();
  });

  it('should display content as received from query', () => {
    const title = faker.lorem.sentence();
    const paragraph = faker.lorem.paragraph();
    const content = faker.lorem.paragraph();

    render(
      <AboutBlurb title={title} content={paragraph}>
        <p>{content}</p>
      </AboutBlurb>,
    );

    const paragraphTextElement = screen.getByText(paragraph);
    const titleTextElement = screen.getByText(title);
    const contentTextElement = screen.getByText(content);

    expect(paragraphTextElement).toBeInTheDocument();
    expect(titleTextElement).toBeInTheDocument();
    expect(contentTextElement).toBeInTheDocument();
  });
});
