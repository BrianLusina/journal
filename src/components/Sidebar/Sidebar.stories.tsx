import { ComponentStory, ComponentMeta } from '@storybook/react';
import Sidebar from './Sidebar';

export default {
  title: 'Components/Sidebar',
  component: Sidebar,
} as ComponentMeta<typeof Sidebar>;

const Template: ComponentStory<typeof Sidebar> = (args) => <Sidebar {...args} />;

export const DefaultSidebar = Template.bind({});
DefaultSidebar.args = {
  children: [
    <div key={1}>
      <h3>SideBar</h3>
    </div>,
  ],
};
