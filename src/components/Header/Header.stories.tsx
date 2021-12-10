import { ComponentStory, ComponentMeta } from '@storybook/react';
import faker from 'faker';
import Header from './Header';

const link = faker.internet.url();
const name = faker.random.word();

export default {
  title: 'Components/Header',
  component: Header,
} as ComponentMeta<typeof Header>;

const Template: ComponentStory<typeof Header> = (args) => <Header {...args} />;

export const DefaultHeader = Template.bind({});
DefaultHeader.args = {
  title: 'Header',
  children: <a href={link}>{name}</a>,
};
