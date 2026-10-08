import { Meta, StoryFn } from '@storybook/react';
import Menu from './Menu';

export default {
  title: 'Components/Menu',
  component: Menu,
} as Meta<typeof Menu>;

const Template: StoryFn<typeof Menu> = (args) => <Menu {...args} />;

export const DefaultMenu = Template.bind({});
DefaultMenu.args = {};
