import faker from 'faker';
import { render, screen } from '@testing-library/react';
import MockAppWithRouter from '@testUtils/MockAppWithRouter';
import PostItem from './PostItem';

describe('PostItem', () => {
  it('should render', () => {
    const title = faker.lorem.sentence();
    const subtitle = faker.lorem.sentence();
    const excerpt = faker.lorem.paragraph();
    const link = faker.internet.url();
    const date = faker.date.past().toISOString();
    const image = {
      src: faker.image.imageUrl(),
      alt: faker.lorem.word(),
    };
    const tags = [faker.lorem.word(), faker.lorem.word()];
    const author = {
      avatar: faker.image.avatar(),
      name: faker.name.firstName(),
      link: faker.internet.url(),
    };

    const props = {
      title,
      subtitle,
      excerpt,
      link,
      date,
      img: image,
      tags,
      author,
    };

    render(
      <MockAppWithRouter>
        <PostItem {...props} />
      </MockAppWithRouter>,
    );

    const titleTextElement = screen.getByText(title);
    const subtitleTextElement = screen.getByText(subtitle);
    const excerptTextElement = screen.getByText(excerpt);
    const linkElements = screen.getAllByRole('link');
    const dateElement = screen.getByText(date);
    const imageElements = screen.getAllByRole('img');
    const tagsElement = screen.getByText(tags[0]);

    expect(titleTextElement).toBeInTheDocument();
    expect(subtitleTextElement).toBeInTheDocument();
    expect(excerptTextElement).toBeInTheDocument();
    linkElements.forEach((linkElement) => {
      expect(linkElement).toBeInTheDocument();
    });
    expect(dateElement).toBeInTheDocument();
    imageElements.forEach((imageElement) => {
      expect(imageElement).toBeInTheDocument();
    });
    expect(tagsElement).toBeInTheDocument();
  });
});
