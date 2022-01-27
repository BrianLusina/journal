import { ComponentStory, ComponentMeta } from '@storybook/react';
import faker from 'faker';
import MiniPost from './MiniPost';

export default {
  title: 'Components/MiniPost',
  component: MiniPost,
} as ComponentMeta<typeof MiniPost>;

const Template: ComponentStory<typeof MiniPost> = (args) => <MiniPost {...args} />;

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
  author: {
    link: authorLink,
    slug: authorSlug,
    id: authorId,
    avatar: authorAvatar,
    name: authorName,
  },
  time,
  imgUrl,
};

export const DefaultMiniPost = Template.bind({});
DefaultMiniPost.args = {
  ...props,
};
