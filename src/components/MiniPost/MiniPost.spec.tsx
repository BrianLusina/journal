import { render, screen } from '@testing-library/react';
import MockApp from '@testUtils/MockApp';
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
    const authorId = faker.datatype.uuid();

    const props = {
      id,
      slug,
      link,
      title,
      authorIds: [authorId],
      time,
      imgUrl,
    };

    render(
      <MockApp>
        <MiniPostItem {...props} />
      </MockApp>,
    );

    const titleElement = screen.getByText(title);
    expect(titleElement).toBeInTheDocument();
  });
});
