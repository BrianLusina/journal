import { Meta, StoryFn } from '@storybook/react';
import faker from 'faker';
import MiniPost from './MiniPost';

export default {
  title: 'Components/MiniPost',
  component: MiniPost,
} as Meta<typeof MiniPost>;

const Template: StoryFn<typeof MiniPost> = (args) => <MiniPost {...args} />;

const id = faker.datatype.uuid();
const slug = faker.random.word();
const link = `/posts/${slug}`;
const title = faker.lorem.word();
const time = faker.date.recent().toDateString();
const imgUrl = faker.image.imageUrl();

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
      id: authorId,
      source: 'contentful' as const,
      avatarUrl: authorAvatar,
      name: authorName,
    },
  ],
  time,
  imgUrl,
};

export const DefaultMiniPost = Template.bind({});
DefaultMiniPost.args = {
  ...props,
};
