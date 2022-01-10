import { render, screen } from '@testing-library/react';
import MockAppWithRouter from '@testUtils/MockAppWithRouter';
import faker from 'faker';
import MiniPostItem from './MiniPost';

describe('MiniPostItem', () => {
  it('should be able to render', () => {
    const id = faker.datatype.uuid();
    const slug = faker.random.word();
    const link = `/posts/${slug}`;
    const title = faker.lorem.word();
    const time = faker.date.recent().toDateString();
    const imgUrl = faker.image.imageUrl();

    const authorSlug = faker.random.word();
    const authorLink = `/authors/${authorSlug}`;
    const authorName = faker.name.firstName();
    const authorId = faker.datatype.uuid();
    const authorAvatar = faker.image.imageUrl();

    const props = {
      id,
      slug,
      link,
      title,
      authors: [
        {
          link: authorLink,
          slug: authorSlug,
          id: authorId,
          avatar: authorAvatar,
          name: authorName,
        },
      ],
      time,
      imgUrl,
    };

    render(
      <MockAppWithRouter>
        <MiniPostItem {...props} />
      </MockAppWithRouter>,
    );

    const titleElement = screen.getByText(title);
    expect(titleElement).toBeInTheDocument();
  });
});
