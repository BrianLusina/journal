import { Meta, StoryFn } from '@storybook/react';
import Navbar from './Navbar';

export default {
  title: 'Components/Navbar',
  component: Navbar,
} as Meta<typeof Navbar>;

const Template: StoryFn<typeof Navbar> = (args) => <Navbar {...args} />;

export const DefaultNavbar = Template.bind({});
DefaultNavbar.args = {};
