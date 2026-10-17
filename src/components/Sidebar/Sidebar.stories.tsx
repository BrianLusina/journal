import { Meta, StoryFn } from '@storybook/react';
import Sidebar from './Sidebar';

export default {
  title: 'Components/Sidebar',
  component: Sidebar,
} as Meta<typeof Sidebar>;

const Template: StoryFn<typeof Sidebar> = (args) => <Sidebar {...args} />;

export const DefaultSidebar = Template.bind({});
DefaultSidebar.args = {
  children: [
    <div key={1}>
      <h3>SideBar</h3>
    </div>,
  ],
};
