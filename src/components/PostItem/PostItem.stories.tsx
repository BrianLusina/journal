import { ComponentStory, ComponentMeta } from '@storybook/react';
import faker from 'faker';
import PostItem from './PostItem';

export default {
  title: 'Components/PostItem',
  component: PostItem,
} as ComponentMeta<typeof PostItem>;

const Template: ComponentStory<typeof PostItem> = (args) => <PostItem {...args} />;

const title = faker.lorem.sentence();
const subtitle = faker.lorem.sentence();
const text = faker.lorem.paragraph();
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

export const DefaultPostItem = Template.bind({});
DefaultPostItem.args = {
  title,
  subtitle,
  excerpt: text,
  link,
  date,
  img: image,
  tags,
  author,
};
