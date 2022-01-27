import { ComponentStory, ComponentMeta } from '@storybook/react';
import NotFound from './NotFound';

export default {
  title: 'Pages/NotFound',
  component: NotFound,
} as ComponentMeta<typeof NotFound>;

const Template: ComponentStory<typeof NotFound> = (args) => <NotFound {...args} />;

export const NotFoundPage = Template.bind({});
NotFoundPage.args = {};
