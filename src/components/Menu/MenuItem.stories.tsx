import { ComponentStory, ComponentMeta } from '@storybook/react';
import faker from 'faker';
import MenuItem from './MenuItem';

export default {
  title: 'Components/Menu/MenuItem',
  component: MenuItem,
} as ComponentMeta<typeof MenuItem>;

const Template: ComponentStory<typeof MenuItem> = (args) => <MenuItem {...args} />;

const link = faker.internet.url();
const title = faker.random.word();
const description = faker.random.words(3);

export const DefaultMenuItem = Template.bind({});
DefaultMenuItem.args = {
  link,
  title,
  description,
};
